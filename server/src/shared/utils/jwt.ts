import type { JwtPayload } from "jsonwebtoken";
import type { JwtAccessTokenPayload } from "@/shared/types/jwt.types.js";

export const isJwtAccessTokenPayload = (
    payload: string | JwtPayload
): payload is JwtAccessTokenPayload => {
    return (
        typeof payload === "object" &&
        payload !== null &&
        typeof payload.userId === "number" &&
        typeof payload.sessionId === "string" &&
        payload.sessionId.length > 0 &&
        typeof payload.isVerified === "boolean"
    );
};