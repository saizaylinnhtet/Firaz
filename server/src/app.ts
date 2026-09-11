import express, { type Express } from "express";
import { HealthRoutes } from "./routes/health.routes.js";
import { UserRoutes } from "./routes/user.routes.js";
import { AuthRoutes } from "./routes/auth.routes.js";
import {
  errorMiddleware,
  zodErrorMiddleware,
} from "./middlewares/error.middleware.js";

export class App {
  public app: Express;
  private static readonly API_VERSION = "/api/v1";
  private healthRoutes!: HealthRoutes;
  private authRoutes!: AuthRoutes;
  private userRoutes!: UserRoutes;

  constructor() {
    this.app = express();
    this.initializeInstances();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorMiddleware();
  }

  private setupMiddlewares(): void {
    this.app.use(express.json());
  }

  private initializeInstances() {
    this.healthRoutes = new HealthRoutes();
    this.userRoutes = new UserRoutes();
    this.authRoutes = new AuthRoutes();
  }

  private setupRoutes(): void {
    this.app.use(`${App.API_VERSION}/health`, this.healthRoutes.getRouter());
    this.app.use(`${App.API_VERSION}/auth`, this.authRoutes.getRouter());
    this.app.use(`${App.API_VERSION}/users`, this.userRoutes.getRouter());
  }

  private setupErrorMiddleware(): void {
    this.app.use(zodErrorMiddleware);
    this.app.use(errorMiddleware);
  }

  getApp(): Express {
    return this.app;
  }
}
