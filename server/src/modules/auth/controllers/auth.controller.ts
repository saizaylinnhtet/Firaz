import { type Request, type Response } from "express";
import { signInSchema, signUpSchema, signUpVerifySchema } from "@/modules/auth/validators/auth.schema.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import { durationToMs } from "@/shared/utils/duration.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";


export class AuthController {
    constructor(private readonly authService: AuthService) {}

    signUp = async (req: Request, res: Response): Promise<void> => {
        const data = signUpSchema.parse(req.body)
        const result = await this.authService.signUp(data)
        const { password, ...userWithoutPassword } = result.user
        res.status(201).json({ message: "success", userWithoutPassword});
    }

    signIn = async (req: Request, res: Response): Promise<void> => {
        const data = signInSchema.parse(req.body)
        const result = await this.authService.signIn(data) 
        this.setCookie(res, result.accessToken)
        this.setRefreshCookie(res, result.refreshToken)
        const { refreshToken, ...response } = result;
        res.status(200).json({ message: "success", response })
    }

    signUpVerify = async (req: Request, res: Response): Promise<void> => {
        const data = signUpVerifySchema.parse(req.body)
        const result = await this.authService.signUpVerify(data)
        this.setCookie(res, result.accessToken)
        this.setRefreshCookie(res, result.refreshToken)
        const { refreshToken, ...response } = result;
        res.status(200).json({ message: "success", response })
    }

    refreshToken = async (req: Request, res: Response): Promise<void> => {
        const token = this.getRefreshToken(req)
        if (!token) { throw new UnauthorizedError("Authentication required"); }
        const tokens = await this.authService.rotateRefreshToken(token)
        if (!tokens) { throw new UnauthorizedError("Authentication required"); }
        this.setCookie(res, tokens.newAccessToken)
        this.setRefreshCookie(res, tokens.newRefreshToken)
        res.status(200).json({ 
            message: "Successfully Refreshed Token", 
            accessToken: tokens.newAccessToken
        })
    }

    signOut = async (req: Request, res: Response): Promise<void> => {
        const token = this.getRefreshToken(req)
        if (!token) { throw new UnauthorizedError("Authentication required"); }
        await this.authService.revokeSession(token)
        this.clearAuthCookies(res)
        res.status(200).json({ message: "Sign-out Successful"})
    }

    signOutAll = async (req: Request, res: Response): Promise<void> => {
        await this.authService.revokeAllUserSessions(req.user!.userId);
        this.clearAuthCookies(res);
        res.status(200).json({ message: "Sign-out Successful for all Devices" })
    }

    private setCookie(res: Response, token: string) {
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: durationToMs(process.env.JWT_EXPIRES_IN!),
            path: "/",
        });
    }

    private setRefreshCookie(res: Response, token: string) {
        res.cookie("refreshToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: durationToMs(process.env.REFRESH_EXPIRES_IN!),
            path: "/",
        });
    }

    private clearAuthCookies(res: Response): void {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });
    
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });
    }

    private getRefreshToken(req: Request): string | undefined {
        const authHeader = req.headers.authorization || '';
        const [scheme, tokenFromHeader] = authHeader.split(' ');
        const tokenFromCookie = req.cookies?.refreshToken;
        const token = scheme === 'Bearer' && tokenFromHeader ? tokenFromHeader : tokenFromCookie;
        return token
    }

    
}