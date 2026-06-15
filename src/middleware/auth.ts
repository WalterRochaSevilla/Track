// src/middleware/auth.ts
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { ENV } from "../config/environments.js";

// Augment the Express Request type so TypeScript knows req.empresaId exists.
declare global {
  namespace Express {
    interface Request {
      empresaId: string;
    }
  }
}

interface JwtPayload {
  empresaId: string;
  iat?: number;
  exp?: number;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = ENV.JWT_SECRET;
    if (!secret) {
      res
        .status(500)
        .json({ error: "Server misconfiguration: JWT_SECRET not set" });
      return;
    }

    const payload = jwt.verify(token, secret) as JwtPayload;

    if (!payload.empresaId) {
      res.status(401).json({ error: "Token missing required empresaId claim" });
      return;
    }

    req.empresaId = payload.empresaId;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid token";
    res.status(401).json({ error: message });
  }
}

