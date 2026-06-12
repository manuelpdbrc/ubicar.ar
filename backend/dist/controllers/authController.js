"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const BCRYPT_ROUNDS = 12;
/**
 * Register a new user.
 * Hashes the password, creates the user record, and returns a signed JWT.
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // Check if email is already taken
        const [existingRows] = await db_1.default.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingRows.length > 0) {
            res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
        const [result] = await db_1.default.execute('INSERT INTO users (name, email, password, globalRole, createdAt, updatedAt) VALUES (?, ?, ?, \'USER\', NOW(3), NOW(3))', [name, email, hashedPassword]);
        const user = {
            id: result.insertId,
            name,
            email,
            globalRole: 'USER',
        };
        const token = (0, authMiddleware_1.signToken)({ id: user.id, globalRole: user.globalRole });
        res.status(201).json({ token, user });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
/**
 * Log in an existing user.
 * Validates credentials and returns a signed JWT.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db_1.default.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) {
            res.status(401).json({ error: 'Email o contraseña incorrectos' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ error: 'Email o contraseña incorrectos' });
            return;
        }
        const token = (0, authMiddleware_1.signToken)({ id: user.id, globalRole: user.globalRole });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                globalRole: user.globalRole,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
/**
 * Get the currently authenticated user's profile.
 * Requires the `authenticate` middleware to run first.
 */
const getMe = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [rows] = await db_1.default.execute('SELECT id, name, email, globalRole, createdAt FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
//# sourceMappingURL=authController.js.map