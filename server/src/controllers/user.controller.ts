import { type Request, type Response } from "express";


export class UserController {
    getUser = (req: Request, res: Response) => {
        return res.json({
            'message': "Get User"
        })
    }
}