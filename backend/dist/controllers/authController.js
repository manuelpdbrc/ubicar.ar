"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
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
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                globalRole: true,
            },
        });
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
        const user = await prisma_1.default.user.findUnique({ where: { email } });
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
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                globalRole: true,
                createdAt: true,
            },
        });
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