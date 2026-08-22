"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-jotabarber';
const mapRole = (rol) => {
    if (rol === client_1.Rol.CLIENTE)
        return 'CLIENT';
    return rol; // STAFF, ADMIN are the same in database and frontend
};
const register = async (req, res) => {
    const { password, name, phone } = req.body;
    if (!password || !name || !phone) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    try {
        const existingUser = await db_1.default.usuario.findFirst({
            where: {
                telefono: phone,
            },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'El teléfono ya está registrado' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db_1.default.usuario.create({
            data: {
                password: hashedPassword,
                nombre: name,
                telefono: phone,
                rol: client_1.Rol.CLIENTE,
                saldoPuntos: 0,
                cortesCompletados: 0,
            },
        });
        const token = jwt.sign({ id: user.id, role: user.rol, name: user.nombre }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: '', // Campo vacío para compatibilidad con el frontend
                name: user.nombre,
                phone: user.telefono,
                role: mapRole(user.rol),
                pointsBalance: user.saldoPuntos,
                completedCuts: user.cortesCompletados,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({ message: 'Teléfono y contraseña son requeridos' });
    }
    try {
        const user = await db_1.default.usuario.findUnique({
            where: { telefono: phone },
        });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id, role: user.rol, name: user.nombre }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            token,
            user: {
                id: user.id,
                email: '', // Compatibilidad frontend
                name: user.nombre,
                phone: user.telefono,
                role: mapRole(user.rol),
                pointsBalance: user.saldoPuntos,
                completedCuts: user.cortesCompletados,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
    }
    try {
        const user = await db_1.default.usuario.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json({
            id: user.id,
            email: '', // Compatibilidad frontend
            name: user.nombre,
            phone: user.telefono,
            role: mapRole(user.rol),
            pointsBalance: user.saldoPuntos,
            completedCuts: user.cortesCompletados,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};
exports.getProfile = getProfile;
