import * as z from "zod"


export const signUpSchema = z.object({
    email: z.email(),
    name: z.string().trim().min(3).max(20),
    password: z.string().min(6)
}) 

export const signInSchema = z.object({
    email: z.email(),
    password: z.string()
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>