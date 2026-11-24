import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace.js";
import prisma from "@/infrastructure/database/prisma.js";
import type { CreateSessionData } from "@/modules/auth/types/session.types.js";

export class AuthRepository {
  async createSession(data: CreateSessionData, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.create({
      data,
    });
  }

  findActiveSession(sessionId: string, userId: number) {
    return prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });
  }

  async findSessionByTokenHash(tokenHash: string, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  async revokeSession(sessionId: string, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserSessions(userId: number, tx?: TransactionClient) {
    const db = tx ?? prisma;
    return db.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async rotateSessionToken(
    data: {
      sessionId: string;
      currentTokenHash: string;
      newTokenHash: string;
      expiresAt: Date;
    },
    tx?: TransactionClient,
  ) {
    const db = tx ?? prisma;

    return db.session.updateMany({
      where: {
        id: data.sessionId,
        tokenHash: data.currentTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        tokenHash: data.newTokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }
}
