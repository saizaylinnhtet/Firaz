import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { InvalidCredentialsError } from "@/shared/errors/invalid-credentials.error.js";
import { Prisma } from "@/generated/prisma/client.js";
import { ConflictError } from "@/shared/errors/conflict.error.js";
import { NotFoundError } from "@/shared/errors/notfound.error.js";
import jwt from "jsonwebtoken";

const { JsonWebTokenError, TokenExpiredError, NotBeforeError } = jwt;

export const zodErrorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const messages = [];
  if (err instanceof ZodError) {
    for (const issue of err.issues) {
      messages.push({
        name: issue.path[0],
        message: issue.message,
      });
    }
    res.status(400).json({
      message: messages,
    });
    return;
  }
  next(err);
};

export const jwtErrorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      message: "Invalid Access Token",
    });
    return;
  }
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      message: "Access token expired",
    });
    return;
  }

  if (err instanceof NotBeforeError) {
    res.status(401).json({
      message: err.message,
    });
    return;
  }
  next(err);
};

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(err);

  if (err instanceof InvalidCredentialsError) {
    res.status(401).json({
      message: err.message,
    });
    return;
  }
  if (err instanceof ConflictError) {
    res.status(409).json({
      message: err.message,
    });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({
      message: err.message,
    });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        res.status(409).json({
          message: "Resource already exists",
        });
        return;

      case "P2025":
        res.status(404).json({
          message: "Resource not found",
        });
        return;

      case "P2003":
        res.status(409).json({
          message: "Related resource constraint failed",
        });
        return;

      case "P2024":
        res.status(503).json({
          message: "Database service unavailable",
        });
        return;
    }
  }

  res.status(500).json({
    message: "Internal Server Error",
  });
};
