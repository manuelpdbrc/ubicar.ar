"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, password } = req.body;
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'El email ya está registrado.' });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, globalRole: user.globalRole }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, globalRole: user.globalRole } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return;
        }
        const isValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, globalRole: user.globalRole }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, globalRole: user.globalRole } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});
exports.login = login;
