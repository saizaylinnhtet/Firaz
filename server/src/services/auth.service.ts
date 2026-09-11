import { ConflictError } from "../errors/conflict.error.js";
import { InvalidCredentialsError } from "../errors/invalid-credentials.error.js";
import { checkPassword, hashPassword } from "../lib/bcrypt.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import { type SignInInput, type SignUpInput } from "../schemas/auth.schema.js";


export class AuthService {
    constructor(private readonly authRepository: AuthRepository) {}

    async signUp(data: SignUpInput) {     
        const existingUser = await this.authRepository.findByEmail(data.email)
        if (existingUser) throw new ConflictError("User Already Exist")
        const hashedPassword = await hashPassword(data.password)
        const createUserData = {...data, "password": hashedPassword}
        const user = await this.authRepository.createUser(createUserData)
        return { message: "success", user }
    }

    async signIn(data: SignInInput) {
        const existingUser = await this.authRepository.findByEmail(data.email)
        if (!existingUser) throw new InvalidCredentialsError("Invalid email or password");
        const isCheckPassword = await checkPassword(data.password, existingUser.password)
        if (!isCheckPassword) throw new InvalidCredentialsError("Invalid email or password")
        const { password, ...userWithoutPassword } = existingUser;
        return { message: "success", userWithoutPassword}
    }
}