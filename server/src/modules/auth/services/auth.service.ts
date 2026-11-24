import { OtpType, type Session, type User } from "@/generated/prisma/client.js";
import { ConflictError } from "@/shared/errors/conflict.error.js";
import { InvalidCredentialsError } from "@/shared/errors/invalid-credentials.error.js";
import { NotFoundError } from "@/shared/errors/notfound.error.js";
import { hashCode, checkCode } from "@/shared/utils/bcrypt.js";
import prisma from "@/infrastructure/database/prisma.js";
import type { AuthRepository } from "@/modules/auth/repositories/auth.repository.js";
import type { OtpRepository } from "@/modules/auth/repositories/otp.repository.js";
import { type SignInInput, type SignUpInput, type SignUpVerifyInput } from "@/modules/auth/validators/auth.schema.js";
import type { CreateOtpData } from "@/modules/auth/types/otp.types.js";
import crypto from "node:crypto"
import type { JwtService } from "@/shared/services/jwt.service.js";
import type { JwtAccessTokenPayload } from "@/shared/types/jwt.types.js";
import type { ResendService } from "@/shared/services/resend.service.js";
import type { ResendEmailBody } from "@/shared/types/resend.types.js";
import type { RefreshTokenService } from "@/modules/auth/services/refresh-token.service.js";
import { durationToMs } from "@/shared/utils/duration.js";
import type { UserRepository } from "@/modules/user/repositories/user.repository.js";
import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";


export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly resendService: ResendService,
        private readonly authRepository: AuthRepository,
        private readonly userRepository: UserRepository,
        private readonly otpRepository: OtpRepository
    ) {}

    async signUp(data: SignUpInput) {     
        const existingUser = await this.userRepository.findByEmail(data.email)
        if (existingUser?.isVerified) { throw new ConflictError("User Already Exist"); }
        // hashing user password
        const hashedPassword = await hashCode(data.password)
        const createUserData = {...data, "password": hashedPassword}

        // hashing otp
        const otp = crypto.randomInt(100000, 1000000).toString()
        console.log(otp)
        const hashedOtp = await hashCode(otp)

        // create user and otp
        const result = await prisma.$transaction(async (tx) => {
            // retake existing user and update if not verified instead of creating new
            const user = existingUser
                ? await this.userRepository.updateUser(
                      existingUser.id,
                      { ...data, password: hashedPassword },
                      tx
                  )
                : await this.userRepository.createUser(createUserData, tx);
        
            const otpData: CreateOtpData = {
                userId: user.id,
                otpCode: hashedOtp,
                otpExpirationTime: new Date(Date.now() + 3 * 60 * 1000),
                otpType: OtpType.SIGNUP,
            };
        
            const otp = await this.otpRepository.createOtp(otpData, tx);
        
            return { user, otp };
        });
        const emailBody: ResendEmailBody = {
            'from': 'onboarding@resend.dev',
            'to': result.user.email,
            'replyTo': 'onboarding@resend.dev',
            'subject': 'OTP Verification Code for Firaz',
            'text': otp
        }
        void this.resendService.sendMail(emailBody).catch((error) => {
            console.error("Failed to send signup OTP email:", error);
        });
        return result
    }

    async signIn(data: SignInInput) {
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (!existingUser || !existingUser.isVerified) {
            throw new InvalidCredentialsError("Invalid email or password");
        }
        const isCheckPassword = await checkCode(data.password, existingUser.password);
        if (!isCheckPassword) {
            throw new InvalidCredentialsError("Invalid email or password");
        }
        const { password, ...userWithoutPassword } = existingUser;
        const { refreshToken, sessionId } = await this.createRefreshToken(existingUser);
        const payload: JwtAccessTokenPayload = {
            userId: userWithoutPassword.id,
            sessionId,
            isVerified: true,
        };
        const accessToken = this.jwtService.signAccessToken(payload);
        return { userWithoutPassword, accessToken, refreshToken };
    }

    async signUpVerify(data: SignUpVerifyInput) {
        const existingOtp = await this.otpRepository.findOtpByUserId(data.userId);
    
        if (!existingOtp) throw new NotFoundError("Otp not found");
        if (existingOtp.otpExpirationTime < new Date()) {
            throw new InvalidCredentialsError("Otp expired");
        }

        const isValidOtp = await checkCode(data.otp, existingOtp.otpCode);
        if (!isValidOtp) throw new InvalidCredentialsError("Invalid OTP");

        const result = await prisma.$transaction(async (tx) => {
            const user = await this.userRepository.updateUser(data.userId, {
                isVerified: true,
                emailVerifiedAt: new Date()
            }, tx);
            await this.otpRepository.deleteOtp(existingOtp.id, tx);

            const { refreshToken, sessionId } = await this.createRefreshToken(user, tx);
            const payload: JwtAccessTokenPayload = {
                userId: user.id,
                sessionId,
                isVerified: true,
            };
            const accessToken = this.jwtService.signAccessToken(payload);
            return { user, accessToken, refreshToken };
        });
        const { password, ...userWithoutPassword } = result.user;
        return {
            message: "success",
            userWithoutPassword,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        };
    }

    async resendSignUpOtp(data: { email: string }) {
        const existingUser = await this.userRepository.findByEmail(data.email);
    
        if (!existingUser) { throw new NotFoundError("User not found"); }
    
        if (existingUser.isVerified) { throw new ConflictError("User already verified"); }
    
        // Generate and hash new OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const hashedOtp = await hashCode(otp);
    
        // Find existing user related OTP
        const existingOtp = await this.otpRepository.findOtpByUserId(existingUser.id);
    
        // Delete old OTP and create new OTP
        await prisma.$transaction(async (tx) => {
            if (existingOtp) {
                await this.otpRepository.deleteOtp(existingOtp.id, tx);
            }
    
            const otpData: CreateOtpData = {
                userId: existingUser.id,
                otpCode: hashedOtp,
                otpExpirationTime: new Date(Date.now() + 3 * 60 * 1000),
                otpType: OtpType.SIGNUP,
            };
    
            await this.otpRepository.createOtp(otpData, tx);
        });
    
        // Send new OTP email (non-blocking)
        const emailBody: ResendEmailBody = {
            from: "onboarding@resend.dev",
            to: existingUser.email,
            replyTo: "onboarding@resend.dev",
            subject: "OTP Verification Code for Firaz",
            text: otp,
        };
    
        void this.resendService.sendMail(emailBody).catch((error) => {
            console.error("Failed to resend signup OTP email:", error);
        });
    
        return { message: "OTP resent successfully" };
    }

    async createRefreshToken(user: User, tx?: TransactionClient) {
        const refreshToken = this.refreshTokenService.generateToken();
        const hashedRefreshToken = this.refreshTokenService.hashToken(refreshToken);

        const refreshExpireIn = process.env.REFRESH_EXPIRES_IN;

        if (!refreshExpireIn) {
            throw new Error("Refresh expiration time is not configured");
        }
        const session = await this.authRepository.createSession({
            userId: user.id,
            tokenHash: hashedRefreshToken,
            expiresAt: new Date(Date.now() + durationToMs(refreshExpireIn))
        }, tx);

        return {
            refreshToken,
            sessionId: session.id,
        };
    }

    async findSessionByRefreshToken(refreshToken: string) {
        const hashedRefreshToken = this.refreshTokenService.hashToken(refreshToken)
        const existingSession = await this.authRepository.findSessionByTokenHash(hashedRefreshToken)
        return existingSession
    }

    async rotateRefreshToken(refreshToken: string) {
        const existingSession = await this.findSessionByRefreshToken(refreshToken);
        if (
            !existingSession ||
            existingSession.expiresAt < new Date() ||
            existingSession.revokedAt
        ) {
            return false;
        }

        const user = await this.userRepository.findById(existingSession.userId);
        if (!user) {
            throw new UnauthorizedError("No User Found");
        }
    
        const refreshExpireIn = process.env.REFRESH_EXPIRES_IN;
        if (!refreshExpireIn) {
            throw new Error("Refresh expiration time is not configured");
        }
    
        const newRefreshToken = this.refreshTokenService.generateToken();
        const hashedRefreshToken = this.refreshTokenService.hashToken(newRefreshToken);
    
        const newTokens = await prisma.$transaction(async (tx) => {
            const rotated = await this.authRepository.rotateSessionToken({
                sessionId: existingSession.id,
                currentTokenHash: existingSession.tokenHash,
                newTokenHash: hashedRefreshToken,
                expiresAt: new Date(Date.now() + durationToMs(refreshExpireIn)),
            }, tx);
    
            if (rotated.count !== 1) {
                throw new UnauthorizedError("Refresh token is invalid or already used");
            }
    
            const payload: JwtAccessTokenPayload = {
                userId: user.id,
                sessionId: existingSession.id,
                isVerified: true,
            };
    
            const accessToken = this.jwtService.signAccessToken(payload);
    
            return {
                refreshToken: newRefreshToken,
                accessToken,
            };
        });
    
        return {
            newRefreshToken: newTokens.refreshToken,
            newAccessToken: newTokens.accessToken,
        };
    }

    async revokeSession(refreshToken: string) {
        const existingSession = await this.findSessionByRefreshToken(refreshToken)
        if (!existingSession || existingSession.expiresAt < new Date(Date.now()) || existingSession.revokedAt) {
            throw new UnauthorizedError("Authentication required");
        }
        await this.authRepository.revokeSession(existingSession.id);
    }

    async revokeAllUserSessions(userId: number) {
        await this.authRepository.revokeAllUserSessions(userId)
    }
}