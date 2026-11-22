import type { NextFunction, Request, Response } from "express";
import type { JwtService } from "@/shared/services/jwt.service.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { isJwtAccessTokenPayload } from "@/shared/utils/jwt.js";

export const createAuthMiddleware = (jwtService: JwtService) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.accessToken
        if (!token) {
            throw new UnauthorizedError("Authentication required");
        }
        const decoded = jwtService.verifyAccessToken(token)
        if (!isJwtAccessTokenPayload(decoded)) {
            throw new UnauthorizedError("Invalid access token payload");
        }
        req.user = {
            userId: decoded.userId,
            isVerified: decoded.isVerified,
        };
        next()
    }
}