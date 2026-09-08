import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";

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
                "name": issue.path[0],
                "message": issue.message
            });
        }
        res.status(400).json({
            message: messages
        })
        return;
    }
    next(err)
    
};

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(err);

  res.status(500).json({
    message: "Internal Server Error",
  });
};
