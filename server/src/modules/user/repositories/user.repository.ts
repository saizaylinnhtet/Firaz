import type { TransactionClient } from "@/generated/prisma/internal/prismaNamespace.js";
import prisma from "@/infrastructure/database/prisma.js";
import type { CreateUserData, UpdateUserData } from "@/modules/user/types/user.types.js";


export class UserRepository {
  async findById(id: number) {
    return prisma.user.findUnique({
        where: {
            id
        }
    })
  }

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
}
