import type { OtpType } from "../../generated/prisma/client.js"

export type CreateOtpData = {
    userId: number,
    otpCode: string,
    otpExpirationTime: Date,
    otpType: OtpType
}