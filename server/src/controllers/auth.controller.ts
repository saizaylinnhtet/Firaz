import { type Request, type Response } from "express";
import { signUpSchema } from "../schemas/auth.schema.js";


export class AuthController {
    signUp = (req: Request, res: Response): void => {
        const data = signUpSchema.parse(req.body)
        console.log(data)
        res.json({
            'message': "Sign Up"
        })
    }

    signIn = (req: Request, res: Response): void => {
        res.json({
            'message': "Sign In"
        })
    }
}