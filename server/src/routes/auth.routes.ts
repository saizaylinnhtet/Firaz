import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import type { AuthService } from "../services/auth.service.js";

export class AuthRoutes {

    public readonly router: Router
    private readonly authController: AuthController

    constructor(authService: AuthService) {
        this.router = Router()
        this.authController = new AuthController(authService)
        this.setupRoutes()
    }

    private setupRoutes(): void {
        this.router.post('/sign-up', this.authController.signUp)
        this.router.post('/sign-in', this.authController.signIn)
        this.router.post('/sign-up/verify', this.authController.signUpVerify)
    }

}