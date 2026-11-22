import { type Request, type Response } from "express";
import { signInSchema, signUpSchema, signUpVerifySchema } from "@/modules/auth/validators/auth.schema.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";


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
        this.setCookie(res, result.accessToken)
        res.status(200).json(result)
    }

    signUpVerify = async (req: Request, res: Response): Promise<void> => {
        const data = signUpVerifySchema.parse(req.body)
        const result = await this.authService.signUpVerify(data)
        this.setCookie(res, result.accessToken)
        res.status(200).json(result)
    }

    private setCookie(res: Response, token: string) {
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
            path: "/",
        });
    }
}