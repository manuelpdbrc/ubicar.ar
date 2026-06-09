import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import multer from 'multer';

/**
 * Global Express error handler.
 * Catches known error types (Prisma, Zod, JWT, Multer) and maps them
 * to appropriate HTTP status codes. Falls back to 500 for unknown errors.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── Prisma known request errors ────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'campo';
        res.status(409).json({
          error: `Ya existe un registro con ese valor de ${target}`,
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          error: 'Registro no encontrado',
        });
        return;
      }
      default: {
        res.status(400).json({
          error: 'Error en la base de datos',
        });
        return;
      }
    }
  }

  // ── Zod validation errors ──────────────────────────────────
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // ── JWT errors ─────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ error: 'Token expirado' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  // ── Multer errors ──────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'El archivo excede el tamaño máximo permitido (5 MB)',
      LIMIT_FILE_COUNT: 'Se excedió la cantidad máxima de archivos',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
    };
    res.status(400).json({
      error: messages[err.code] || `Error de carga: ${err.message}`,
    });
    return;
  }

  // ── Default / unknown errors ───────────────────────────────
  const statusCode = (err as any).statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
