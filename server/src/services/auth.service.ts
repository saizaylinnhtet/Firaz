import { OtpType } from "../../generated/prisma/client.js";
import { ConflictError } from "../errors/conflict.error.js";
import { InvalidCredentialsError } from "../errors/invalid-credentials.error.js";
import { NotFoundError } from "../errors/notfound.error.js";
import { hashCode, checkCode } from "../lib/bcrypt.js";
import prisma from "../lib/prisma.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import type { OtpRepository } from "../repositories/otp.repository.js";
import { type SignInInput, type SignUpInput, type SignUpVerifyInput } from "../schemas/auth.schema.js";
import type { CreateOtpData } from "../types/otp.types.js";
import crypto from "node:crypto"
import type { JwtService } from "./jwt.service.js";
import type { JwtAccessTokenPayload } from "../types/jwt.types.js";
import type { ResendService } from "./resend.service.js";
import type { ResendEmailBody } from "../types/resend.types.js";
import { resourceUsage } from "node:process";


export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly resendService: ResendService,
        private readonly authRepository: AuthRepository,
        private readonly otpRepository: OtpRepository
    ) {}

    async signUp(data: SignUpInput) {     
        const existingUser = await this.authRepository.findByEmail(data.email)
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
                ? await this.authRepository.updateUser(
                      existingUser.id,
                      { ...data, password: hashedPassword },
                      tx
                  )
                : await this.authRepository.createUser(createUserData, tx);
        
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
        return { message: "success", result }
    }

    async signIn(data: SignInInput) {
        const existingUser = await this.authRepository.findByEmail(data.email)
        if (!existingUser) throw new InvalidCredentialsError("Invalid email or password");
        const isCheckPassword = await checkCode(data.password, existingUser.password)
        if (!isCheckPassword) throw new InvalidCredentialsError("Invalid email or password")
        const { password, ...userWithoutPassword } = existingUser;
        return { message: "success", userWithoutPassword}
    }

    async signUpVerify(data: SignUpVerifyInput) {
        const existingOtp = await this.otpRepository.findOtpByUserId(data.userId)
        if (!existingOtp) throw new NotFoundError("Otp not found")
        if (existingOtp.otpExpirationTime < new Date()) throw new InvalidCredentialsError("Otp expired")
        const isValidOtp = await checkCode(data.otp, existingOtp.otpCode);
        if (!isValidOtp) throw new InvalidCredentialsError("Invalid OTP")
        await prisma.$transaction(async (tx) => {
            await this.authRepository.updateUser(data.userId, {
                isVerified: true,
                emailVerifiedAt: new Date()
            }, tx)
            await this.otpRepository.deleteOtp(existingOtp.id, tx)
        })
        const payload: JwtAccessTokenPayload = {
            userId: data.userId,
            isVerified: true,
        }
        const accessToken = this.jwtService.signAccessToken(payload)
        return { message: "success", accessToken }
    }

    async resendSignUpOtp(data: { email: string }) {
        const existingUser = await this.authRepository.findByEmail(data.email);
    
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
}