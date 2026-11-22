import type { JwtPayload } from "jsonwebtoken";
import type { JwtAccessTokenPayload } from "@/shared/types/jwt.types.js";

export const isJwtAccessTokenPayload = (
    payload: string | JwtPayload
): payload is JwtAccessTokenPayload => {
    return (
        typeof payload !== "string" &&
        typeof payload.userId === "string" &&
        typeof payload.isVerified === "boolean"
    );
};