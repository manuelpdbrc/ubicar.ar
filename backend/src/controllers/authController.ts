import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import pool from '../db';
import { signToken } from '../middleware/authMiddleware';
import type { RegisterInput, LoginInput } from '../validators/authSchemas';

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user.
 * Hashes the password, creates the user record, and returns a signed JWT.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body as RegisterInput;

    // Check if email is already taken
    const [existingRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingRows.length > 0) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO users (name, email, password, globalRole, createdAt, updatedAt) VALUES (?, ?, ?, \'USER\', NOW(3), NOW(3))',
      [name, email, hashedPassword]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      globalRole: 'USER' as const,
    };

    const token = signToken({ id: user.id, globalRole: user.globalRole });

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user.
 * Validates credentials and returns a signed JWT.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    const token = signToken({ id: user.id, globalRole: user.globalRole });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the currently authenticated user's profile.
 * Requires the `authenticate` middleware to run first.
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, email, globalRole, createdAt FROM users WHERE id = ?',
      [userId]
    );
    const user = rows[0];

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
