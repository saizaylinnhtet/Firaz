import type { JwtAccessTokenPayload } from "@/shared/types/jwt.types.js";

declare global {
    namespace Express {
        interface Request {
            user?: JwtAccessTokenPayload;
        }
    }
}

export {};