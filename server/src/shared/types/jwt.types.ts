import type { JwtPayload } from "jsonwebtoken";

export interface JwtAccessTokenPayload extends JwtPayload {
    userId: number;
    isVerified: boolean;
}