import type { TransactionClient } from "../../generated/prisma/internal/prismaNamespace.js";
import prisma from "../lib/prisma.js";
import type { CreateUserData } from "../types/user.types.js";


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
}
