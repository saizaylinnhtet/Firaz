import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser"

// system imports
import { HealthRoutes } from "@/system/health/routes/health.routes.js";

// auth imports
import { AuthRoutes } from "@/modules/auth/routes/auth.routes.js";
import { AuthRepository } from "@/modules/auth/repositories/auth.repository.js";
import { AuthService } from "@/modules/auth/services/auth.service.js";
import { OtpRepository } from "@/modules/auth/repositories/otp.repository.js";
import { RefreshTokenService } from "@/modules/auth/services/refresh-token.service.js";

//user imports
import { UserRoutes } from "@/modules/user/routes/user.routes.js";
import { UserRepository } from "@/modules/user/repositories/user.repository.js";

// shared imports
import {
  errorMiddleware,
  jwtErrorMiddleware,
  zodErrorMiddleware,
} from "@/shared/middlewares/error.middleware.js";
import { JwtService } from "@/shared/services/jwt.service.js";
import type { CorsOptions } from "@/shared/types/corsoptions.types.js";
import { ResendService } from "@/shared/services/resend.service.js";
import { createAuthMiddleware } from "@/shared/middlewares/auth.middleware.js";
import type { Middlewares } from "@/shared/types/middlewares.types.js";

export class App {
  public readonly app: Express;
  private readonly middlewares: Middlewares
  private static readonly API_VERSION = "/api/v1";
  // repositories
  private authRepository!: AuthRepository;
  private userRepository!: UserRepository;
  private otpRepository!: OtpRepository;
  // services
  private authService!: AuthService;
  private jwtService!: JwtService
  private resendService!: ResendService
  private refreshTokenService!: RefreshTokenService
  // routes
  private healthRoutes!: HealthRoutes;
  private authRoutes!: AuthRoutes;
  private userRoutes!: UserRoutes;

  constructor() {
    this.app = express();
    this.initializeRepositories();
    this.initializeServices();
    this.middlewares = this.createMiddlewares()
    this.setupGlobalMiddlewares();
    this.initializeRoutes();
    this.setupRoutes();
    this.setupErrorMiddleware();
  }

  private corsOptions(): CorsOptions {
    return {
      origin: "http://localhost:5173",
      credentials: true,
    }
  }

  private createMiddlewares() {
    const authMiddleware = createAuthMiddleware(this.jwtService, this.authRepository)
    return {
      authMiddleware
    }
  }

  private setupGlobalMiddlewares(): void {
    this.app.use(cors(this.corsOptions()))
    this.app.use(express.json());
    this.app.use(cookieParser())
  }

  private initializeRepositories(): void {
    this.authRepository = new AuthRepository()
    this.userRepository = new UserRepository(),
    this.otpRepository = new OtpRepository()
  }

  private initializeServices(): void {
    this.jwtService = new JwtService()
    this.resendService = new ResendService()
    this.refreshTokenService = new RefreshTokenService()
    this.authService = new AuthService(
      this.jwtService,
      this.refreshTokenService,
      this.resendService, 
      this.authRepository,
      this.userRepository,
      this.otpRepository
    );
  }

  private initializeRoutes() : void {
    this.healthRoutes = new HealthRoutes();
    this.userRoutes = new UserRoutes();
    this.authRoutes = new AuthRoutes(this.authService, this.middlewares.authMiddleware);
  }

  private setupRoutes(): void {
    this.app.use(`${App.API_VERSION}/health`, this.healthRoutes.router);
    this.app.use(`${App.API_VERSION}/auth`, this.authRoutes.router);
    this.app.use(`${App.API_VERSION}/users`, this.userRoutes.router);
  }

  private setupErrorMiddleware(): void {
    this.app.use(zodErrorMiddleware);
    this.app.use(jwtErrorMiddleware);
    this.app.use(errorMiddleware);
  }

}
