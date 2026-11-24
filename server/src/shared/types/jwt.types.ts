import type { JwtPayload } from "jsonwebtoken";

export interface JwtAccessTokenPayload extends JwtPayload {
    userId: number;
    sessionId: string;
    isVerified: boolean;
}