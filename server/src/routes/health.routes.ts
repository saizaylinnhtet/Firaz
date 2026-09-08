import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";


export class HealthRoutes {
    public router: Router
    public controller: HealthController
    constructor() {
        this.router = Router()
        this.controller = new HealthController()
        this.setupRoutes()
    }

    private setupRoutes(): void {
        this.router.get("/", this.controller.health)
    }

    getRouter(): Router {
        return this.router
    }
}