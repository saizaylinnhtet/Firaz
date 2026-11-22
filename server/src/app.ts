import express, { type Express } from "express";
import cors from "cors";
// system imports
import { HealthRoutes } from "@/system/health/routes/health.routes.js";

// auth imports
import { AuthRoutes } from "@/modules/auth/routes/auth.routes.js";
import { AuthRepository } from "@/modules/auth/repositories/auth.repository.js";
import { AuthService } from "@/modules/auth/services/auth.service.js";
import { OtpRepository } from "@/modules/auth/repositories/otp.repository.js";

//user imports
import { UserRoutes } from "@/modules/user/routes/user.routes.js";

// shared imports
import {
  errorMiddleware,
  jwtErrorMiddleware,
  zodErrorMiddleware,
} from "@/shared/middlewares/error.middleware.js";
import { JwtService } from "@/shared/services/jwt.service.js";
import type { CorsOptions } from "@/shared/types/corsoptions.types.js";
import { ResendService } from "@/shared/services/resend.service.js";

export class App {
  public readonly app: Express;
  private static readonly API_VERSION = "/api/v1";
  // services
  private authService!: AuthService;
  // routes
  private healthRoutes!: HealthRoutes;
  private authRoutes!: AuthRoutes;
  private userRoutes!: UserRoutes;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.initializeRoutes();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorMiddleware();
  }

  private corsOptions(): CorsOptions {
    return {
      origin: "http://localhost:5173",
      credentials: true,
    }
  }

  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(cors(this.corsOptions()))
  }

  private initializeServices() {
    this.authService = new AuthService(new JwtService(), new ResendService(), new AuthRepository(), new OtpRepository());
  }

  private initializeRoutes() {
    this.healthRoutes = new HealthRoutes();
    this.userRoutes = new UserRoutes();
    this.authRoutes = new AuthRoutes(this.authService);
  }

  private setupRoutes(): void {
    this.app.use(`${App.API_VERSION}/health`, this.healthRoutes.getRouter());
    this.app.use(`${App.API_VERSION}/auth`, this.authRoutes.router);
    this.app.use(`${App.API_VERSION}/users`, this.userRoutes.router);
  }

  private setupErrorMiddleware(): void {
    this.app.use(zodErrorMiddleware);
    this.app.use(jwtErrorMiddleware);
    this.app.use(errorMiddleware);
  }

}
