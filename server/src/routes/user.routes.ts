import { Router } from "express"
import { UserController } from "../controllers/user.controller.js"


export class UserRoutes {
    public router: Router
    private userController: UserController
    constructor(){
        this.router = Router()
        this.userController = new UserController()
        this.setupRoutes()
    }

    private setupRoutes(): void {
        this.router.get('/', this.userController.getUser)
    }

}