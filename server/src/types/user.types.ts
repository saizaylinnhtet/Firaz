import type { Otp } from "../../generated/prisma/client.js";

export type CreateUserData = {
    email: string;
    password: string;
    name: string;
};

export type UpdateUserData = {
    email?: string;
    password?: string;
    name?: string;
    emailVerifiedAt?: Date;
    isVerified?: boolean;
};
