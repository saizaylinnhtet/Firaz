import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import type { JwtAccessTokenPayload } from "../types/jwt.types.js";


export class JwtService {
    private readonly jwt_secret: string;
    private readonly jwt_expiresIn: StringValue;
    constructor() {
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN;
        if (!secret || !expiresIn) {
          throw new Error("JWT is not properly configured");
        }
        this.jwt_secret = secret;
        this.jwt_expiresIn = expiresIn as StringValue;
    }
    signAccessToken(payload: JwtAccessTokenPayload) {
        return jwt.sign(payload, this.jwt_secret, { expiresIn: this.jwt_expiresIn, algorithm: "HS256" })
    }
    verifyAccessToken(token: string) {
        return jwt.verify(token, this.jwt_secret, { algorithms: ["HS256"] })
    }
}