import prisma from "../lib/prisma.js";

type CreateUserData = {
    email: string;
    password: string;
    name: string;
};

export class AuthRepository {
  
    async createUser(data: CreateUserData) {
      return prisma.user.create({
        data,
      });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: {
                email,
            }
        })
    }
}