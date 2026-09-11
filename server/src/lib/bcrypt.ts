import bcrypt from "bcrypt"


const DEFAULT_SALT_ROUNDS  = 10;

export function hashPassword(password: string, saltRounds=DEFAULT_SALT_ROUNDS): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}


export function checkPassword(password: string, hashPassword: string): Promise<Boolean> {
    return bcrypt.compare(password, hashPassword)
}