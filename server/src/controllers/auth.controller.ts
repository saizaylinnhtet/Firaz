import { type Request, type Response } from "express";
import { signInSchema, signUpSchema } from "../schemas/auth.schema.js";
import type { AuthService } from "../services/auth.service.js";


export class AuthController {
    constructor(private readonly authService: AuthService) {}

    signUp = async (req: Request, res: Response): Promise<void> => {
        const data = signUpSchema.parse(req.body)
        const result = await this.authService.signUp(data)
        res.status(201).json(result);
    }

    signIn = async (req: Request, res: Response): Promise<void> => {
        const data = signInSchema.parse(req.body)
        const result = await this.authService.signIn(data) 
        res.status(200).json(result)
    }
}