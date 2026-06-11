import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** Possible global roles — replaces the Prisma-generated GlobalRole enum */
export type GlobalRole = 'USER' | 'ADMIN';

// ── Augment Express Request with user payload ────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Shape of the decoded JWT payload attached to req.user */
export interface JwtPayload {
  id: number;
  globalRole: GlobalRole;
}

/**
 * Returns the JWT_SECRET from env, throwing immediately if it's missing.
 * This ensures the app never silently runs without a secret configured.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET no está definido en las variables de entorno. La aplicación no puede iniciar sin esta configuración.'
    );
  }
  return secret;
}

/**
 * Express middleware that verifies a Bearer JWT from the Authorization header.
 * On success, attaches the decoded `{ id, globalRole }` to `req.user`.
 * On failure, responds with 401.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: decoded.id, globalRole: decoded.globalRole };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    next(error);
  }
};

/** 7 days expressed in seconds */
const DEFAULT_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 604800s

/**
 * Helper to generate a signed JWT for a user.
 * @param payload - Data to encode (id, globalRole)
 * @param expiresIn - Token lifetime in seconds (default: 7 days)
 */
export const signToken = (
  payload: JwtPayload,
  expiresIn: number = DEFAULT_TOKEN_EXPIRY
): string => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn });
};
