import type { NextFunction, Request, Response } from "express";
import type { JwtService } from "@/shared/services/jwt.service.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { isJwtAccessTokenPayload } from "@/shared/utils/jwt.js";

export const createAuthMiddleware = (jwtService: JwtService) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization || '';
        const [scheme, tokenFromHeader] = authHeader.split(' ');
        const tokenFromCookie = req.cookies?.access_token;
        const token = scheme === 'Bearer' && tokenFromHeader ? tokenFromHeader : tokenFromCookie;
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