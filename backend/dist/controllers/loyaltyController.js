"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomersList = exports.adjustLoyaltyManual = exports.getLoyaltyDashboard = exports.getLoyaltyHistory = void 0;
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
const getLoyaltyHistory = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'No autenticado' });
    let targetUserId = req.user.id;
    if ((req.user.role === client_1.Rol.ADMIN || req.user.role === client_1.Rol.STAFF) && req.query.userId) {
        targetUserId = String(req.query.userId);
    }
    try {
        const logs = await db_1.default.historialFidelidad.findMany({
            where: { usuarioId: targetUserId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(logs.map((log) => ({
            id: log.id,
            userId: log.usuarioId,
            points: log.puntos,
            reason: log.motivo,
            rewardType: log.tipoRecompensa,
            createdAt: log.createdAt,
        })));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener el historial de fidelización', error: error.message });
    }
};
exports.getLoyaltyHistory = getLoyaltyHistory;
const getLoyaltyDashboard = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'No autenticado' });
    let targetUserId = req.user.id;
    if ((req.user.role === client_1.Rol.ADMIN || req.user.role === client_1.Rol.STAFF) && req.query.userId) {
        targetUserId = String(req.query.userId);
    }
    try {
        const user = await db_1.default.usuario.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                nombre: true,
                saldoPuntos: true,
                cortesCompletados: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json({
            userId: user.id,
            name: user.nombre,
            pointsBalance: user.saldoPuntos,
            completedCuts: user.cortesCompletados,
            cutsRemaining: Math.max(0, 5 - user.cortesCompletados),
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener dashboard de fidelización', error: error.message });
    }
};
exports.getLoyaltyDashboard = getLoyaltyDashboard;
const adjustLoyaltyManual = async (req, res) => {
    const { userId, pointsAdjustment, cutsAdjustment, reason } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'userId es obligatorio' });
    }
    try {
        const user = await db_1.default.usuario.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const updatedPoints = Math.max(0, user.saldoPuntos + (pointsAdjustment ? Number(pointsAdjustment) : 0));
        let updatedCuts = user.cortesCompletados + (cutsAdjustment ? Number(cutsAdjustment) : 0);
        updatedCuts = Math.max(0, updatedCuts % 5);
        const updatedUser = await db_1.default.$transaction(async (tx) => {
            // 1. Registrar cambio en el historial si hubo cambio en puntos
            if (pointsAdjustment && Number(pointsAdjustment) !== 0) {
                await tx.historialFidelidad.create({
                    data: {
                        usuarioId: userId,
                        puntos: Number(pointsAdjustment),
                        motivo: reason || 'Ajuste manual de puntos por administrador',
                    },
                });
            }
            // 2. Registrar cambio en el historial si hubo cambio en cortes
            if (cutsAdjustment && Number(cutsAdjustment) !== 0) {
                await tx.historialFidelidad.create({
                    data: {
                        usuarioId: userId,
                        puntos: 0,
                        motivo: reason || `Ajuste manual de cortes (+${cutsAdjustment}) por administrador`,
                    },
                });
            }
            return tx.usuario.update({
                where: { id: userId },
                data: {
                    saldoPuntos: updatedPoints,
                    cortesCompletados: updatedCuts,
                },
                select: {
                    id: true,
                    nombre: true,
                    saldoPuntos: true,
                    cortesCompletados: true,
                },
            });
        });
        return res.json({
            message: 'Fidelización ajustada manualmente con éxito',
            user: {
                id: updatedUser.id,
                name: updatedUser.nombre,
                pointsBalance: updatedUser.saldoPuntos,
                completedCuts: updatedUser.cortesCompletados,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al ajustar fidelización', error: error.message });
    }
};
exports.adjustLoyaltyManual = adjustLoyaltyManual;
const getCustomersList = async (req, res) => {
    try {
        const customers = await db_1.default.usuario.findMany({
            where: { rol: client_1.Rol.CLIENTE },
            select: {
                id: true,
                nombre: true,
                telefono: true,
                saldoPuntos: true,
                cortesCompletados: true,
                createdAt: true,
                _count: {
                    select: { citas: true },
                },
            },
            orderBy: { nombre: 'asc' },
        });
        return res.json(customers.map((c) => ({
            id: c.id,
            name: c.nombre,
            email: '',
            phone: c.telefono,
            pointsBalance: c.saldoPuntos,
            completedCuts: c.cortesCompletados,
            createdAt: c.createdAt,
            _count: {
                appointments: c._count.citas,
            },
        })));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener lista de clientes', error: error.message });
    }
};
exports.getCustomersList = getCustomersList;
