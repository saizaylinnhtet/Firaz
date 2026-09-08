import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";


export class AuthRoutes {

    public router: Router
    private authController: AuthController

    constructor() {
        this.router = Router()
        this.authController = new AuthController()
        this.setupRoutes()
    }

    private setupRoutes(): void {
        console.log("Setting up auth routes")
        this.router.post('/sign-up', this.authController.signUp)
        this.router.post('/sign-in', this.authController.signIn)
    }

    getRouter(): Router {
        return this.router
    }
}