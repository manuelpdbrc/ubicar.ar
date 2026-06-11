import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import multer from 'multer';

/**
 * Shape of mysql2 errors — errno and code are the key discriminators.
 */
interface MysqlError extends Error {
  errno?: number;
  code?: string;
  sqlState?: string;
  sqlMessage?: string;
}

/**
 * Global Express error handler.
 * Catches known error types (mysql2, Zod, JWT, Multer) and maps them
 * to appropriate HTTP status codes. Falls back to 500 for unknown errors.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── mysql2 errors ──────────────────────────────────────────
  const mysqlErr = err as MysqlError;

  if (mysqlErr.errno === 1062 || mysqlErr.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      error: 'Ya existe un registro con ese valor',
    });
    return;
  }

  if (mysqlErr.errno === 1452 || mysqlErr.code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({
      error: 'Referencia inválida: el registro relacionado no existe',
    });
    return;
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
