import { Router, type RequestHandler } from "express";
import { AuthController } from "@/modules/auth/controllers/auth.controller.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";

export class AuthRoutes {

    public readonly router: Router
    private readonly authController: AuthController
    private readonly authMiddleware: RequestHandler

    constructor(authService: AuthService, authMiddleware: RequestHandler) {
        this.router = Router()
        this.authController = new AuthController(authService)
        this.authMiddleware = authMiddleware
        this.setupRoutes()
    }

    private setupRoutes(): void {
        this.router.post('/sign-up', this.authController.signUp)
        this.router.post('/sign-in', this.authController.signIn)
        this.router.post('/sign-up/verify', this.authController.signUpVerify)
        this.router.post('/refresh-token', this.authController.refreshToken)
        this.router.post('/sign-out', this.authController.signOut);
        this.router.post('/sign-out-all', this.authMiddleware, this.authController.signOutAll);
    }

}