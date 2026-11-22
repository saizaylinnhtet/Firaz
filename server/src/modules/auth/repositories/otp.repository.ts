import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace.js"
import prisma from "@/infrastructure/database/prisma.js"
import type { CreateOtpData } from "@/modules/auth/types/otp.types.js"



export class OtpRepository {

    async createOtp(data: CreateOtpData, tx?: TransactionClient) {
        const db = tx ?? prisma
        return db.otp.create({
            data
        })
    } 

    async findOtpByUserId(userId: CreateOtpData["userId"]) {
        return prisma.otp.findFirst({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }

    async deleteOtp(id: string, tx?: TransactionClient) {
        const db = tx ?? prisma
        return db.otp.delete({
            where: {
                id
            }
        })
    }
}