import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';
import { Rol } from '@prisma/client';

export const getLoyaltyHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });

  let targetUserId = req.user.id;
  if ((req.user.role === Rol.ADMIN || req.user.role === Rol.STAFF) && req.query.userId) {
    targetUserId = String(req.query.userId);
  }

  try {
    const logs = await prisma.historialFidelidad.findMany({
      where: { usuarioId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(
      logs.map((log) => ({
        id: log.id,
        userId: log.usuarioId,
        points: log.puntos,
        reason: log.motivo,
        rewardType: log.tipoRecompensa,
        createdAt: log.createdAt,
      }))
    );
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener el historial de fidelización', error: error.message });
  }
};

export const getLoyaltyDashboard = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });

  let targetUserId = req.user.id;
  if ((req.user.role === Rol.ADMIN || req.user.role === Rol.STAFF) && req.query.userId) {
    targetUserId = String(req.query.userId);
  }

  try {
    const user = await prisma.usuario.findUnique({
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener dashboard de fidelización', error: error.message });
  }
};

export const adjustLoyaltyManual = async (req: AuthRequest, res: Response) => {
  const { userId, pointsAdjustment, cutsAdjustment, reason } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId es obligatorio' });
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updatedPoints = Math.max(0, user.saldoPuntos + (pointsAdjustment ? Number(pointsAdjustment) : 0));
    let updatedCuts = user.cortesCompletados + (cutsAdjustment ? Number(cutsAdjustment) : 0);
    updatedCuts = Math.max(0, updatedCuts % 5);

    const updatedUser = await prisma.$transaction(async (tx) => {
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al ajustar fidelización', error: error.message });
  }
};

export const getCustomersList = async (req: AuthRequest, res: Response) => {
  try {
    const customers = await prisma.usuario.findMany({
      where: { rol: Rol.CLIENTE },
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
    return res.json(
      customers.map((c) => ({
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
      }))
    );
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener lista de clientes', error: error.message });
  }
};
