import type { NextFunction, Request, Response } from "express";
import type { JwtService } from "@/shared/services/jwt.service.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { isJwtAccessTokenPayload } from "@/shared/utils/jwt.js";
import type { AuthRepository } from "@/modules/auth/repositories/auth.repository.js";

export const createAuthMiddleware = (jwtService: JwtService, authRepository: AuthRepository) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization || '';
        const [scheme, tokenFromHeader] = authHeader.split(' ');
        const tokenFromCookie = req.cookies?.accessToken;
        const token = scheme === 'Bearer' && tokenFromHeader ? tokenFromHeader : tokenFromCookie;
        if (!token) {
            throw new UnauthorizedError("Authentication required");
        }
        const decoded = jwtService.verifyAccessToken(token)
        if (!isJwtAccessTokenPayload(decoded)) {
            throw new UnauthorizedError("Invalid access token payload");
        }
        const session = await authRepository.findActiveSession(
            decoded.sessionId,
            decoded.userId
        );
        if (!session) {
            throw new UnauthorizedError("Session expired or revoked");
        }
        req.user = {
            userId: decoded.userId,
            sessionId: decoded.sessionId,
            isVerified: decoded.isVerified,
        };
        next()
    }
}