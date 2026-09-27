import bcrypt from "bcrypt"


const DEFAULT_SALT_ROUNDS  = 10;

export function hashCode(password: string, saltRounds=DEFAULT_SALT_ROUNDS): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}


export function checkCode(password: string, hashPassword: string): Promise<Boolean> {
    return bcrypt.compare(password, hashPassword)
}