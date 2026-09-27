import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { OtpRepository } from "../repositories/otp.repository.js";


export class AuthRoutes {

    public readonly router: Router
    private readonly authController: AuthController
    private readonly authService: AuthService
    private readonly authRepository: AuthRepository
    private readonly otpRepository: OtpRepository

    constructor() {
        this.router = Router()
        this.authRepository = new AuthRepository()
        this.otpRepository = new OtpRepository()
        this.authService = new AuthService(this.authRepository, this.otpRepository)
        this.authController = new AuthController(this.authService)
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