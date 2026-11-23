
import { randomBytes, createHash } from "node:crypto";

export class RefreshTokenService {
    generateToken(): string {
        return randomBytes(64).toString("hex");
    }

    hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }
}
