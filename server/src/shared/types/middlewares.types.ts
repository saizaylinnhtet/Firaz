import type { RequestHandler } from "express";

export type Middlewares = {
    authMiddleware: RequestHandler;
}