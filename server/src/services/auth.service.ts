import { OtpType } from "../../generated/prisma/client.js";
import { ConflictError } from "../errors/conflict.error.js";
import { InvalidCredentialsError } from "../errors/invalid-credentials.error.js";
import { hashCode, checkCode } from "../lib/bcrypt.js";
import prisma from "../lib/prisma.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import type { OtpRepository } from "../repositories/otp.repository.js";
import { type SignInInput, type SignUpInput } from "../schemas/auth.schema.js";
import type { CreateOtpData } from "../types/otp.types.js";
import crypto from "node:crypto"

export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly otpRepository: OtpRepository
    ) {}

    async signUp(data: SignUpInput) {     
        const existingUser = await this.authRepository.findByEmail(data.email)
        if (existingUser) throw new ConflictError("User Already Exist")
        // hashing user password
        const hashedPassword = await hashCode(data.password)
        const createUserData = {...data, "password": hashedPassword}

        // hashing otp
        const hashedOtp = await hashCode(crypto.randomInt(100000, 1000000).toString())
        const result = await prisma.$transaction(async (tx) => {
            const user = await this.authRepository.createUser(createUserData, tx)
            const otpData: CreateOtpData = {
                userId: user.id,
                otpCode: hashedOtp,
                otpExpirationTime: new Date(Date.now() + 60 * 1000),
                otpType: OtpType.SIGNUP,
            }
            const otp = await this.otpRepository.createOtp(otpData, tx)
            return { user, otp }
        })
        
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
}