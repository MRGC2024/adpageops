import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export function correlationIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    (req as any).correlationId = id;
    res.setHeader(CORRELATION_ID_HEADER, id);
    next();
  };
}
