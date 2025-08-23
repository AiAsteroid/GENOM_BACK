import type { NextFunction, Request, Response } from "express";

import type ErrorResponse from "./interfaces/error-response.js";

import { env } from "./env.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);

  const response: ErrorResponse = {
    message: err.message,
    ...(env.NODE_ENV === "production"
      ? { stack: "🥞" }
      : err.stack
        ? { stack: err.stack }
        : {}),
  };

  res.json(response);
}
