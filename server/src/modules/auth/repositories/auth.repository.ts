import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace.js";
import prisma from "@/infrastructure/database/prisma.js";
import type { CreateUserData, UpdateUserData } from "@/modules/user/types/user.types.js";
import type { CreateSessionData } from "@/modules/auth/types/session.types.js";


export class AuthRepository {
  async createUser(data: CreateUserData, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.user.create({
      data,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async updateUser(userId: number, data: UpdateUserData, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }

  async createSession(data: CreateSessionData, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.create({
      data
    })
  }

  async findSessionByTokenHash(tokenHash: string,tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.findFirst({
      where: {
          tokenHash,
      },
    })
  }

  async revokeSession(sessionId: string, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.update({
      where: {
        id: sessionId
      },
      data: {
          revokedAt: new Date(),
      },
    })
  }

  async revokeAllUserSessions(userId: number, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date()
      }
    })
  }
}
