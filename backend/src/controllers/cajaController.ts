import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';

export const getActiveCaja = async (req: AuthRequest, res: Response) => {
  try {
    const activeCaja = await prisma.caja.findFirst({
      where: { estado: 'ABIERTA' },
      include: {
        usuario: { select: { nombre: true } },
      },
    });

    if (!activeCaja) {
      return res.json({ status: 'closed', activeCaja: null });
    }

    return res.json({
      status: 'open',
      activeCaja: {
        id: activeCaja.id,
        usuarioId: activeCaja.usuarioId,
        usuarioNombre: activeCaja.usuario.nombre,
        montoApertura: Number(activeCaja.montoApertura),
        montoEfectivo: Number(activeCaja.montoEfectivo),
        montoQR: Number(activeCaja.montoQR),
        totalVentas: Number(activeCaja.montoEfectivo) + Number(activeCaja.montoQR),
        totalGeneral: Number(activeCaja.montoApertura) + Number(activeCaja.montoEfectivo) + Number(activeCaja.montoQR),
        createdAt: activeCaja.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener estado de caja', error: error.message });
  }
};

export const openCaja = async (req: AuthRequest, res: Response) => {
  const { montoApertura } = req.body;
  const usuarioId = req.user?.id;

  if (!usuarioId) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (montoApertura === undefined || Number(montoApertura) < 0) {
    return res.status(400).json({ message: 'Monto de apertura inválido.' });
  }

  try {
    // Verificar si ya hay una caja abierta
    const existing = await prisma.caja.findFirst({
      where: { estado: 'ABIERTA' },
    });

    if (existing) {
      return res.status(400).json({ message: 'Ya existe una caja abierta activa.' });
    }

    const nuevaCaja = await prisma.caja.create({
      data: {
        usuarioId,
        montoApertura: Number(montoApertura),
        estado: 'ABIERTA',
      },
    });

    return res.status(201).json({ message: 'Caja abierta con éxito.', caja: nuevaCaja });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al abrir caja', error: error.message });
  }
};

export const closeCaja = async (req: AuthRequest, res: Response) => {
  const { montoCierre } = req.body;

  if (montoCierre === undefined || Number(montoCierre) < 0) {
    return res.status(400).json({ message: 'Monto de cierre inválido.' });
  }

  try {
    const activeCaja = await prisma.caja.findFirst({
      where: { estado: 'ABIERTA' },
    });

    if (!activeCaja) {
      return res.status(400).json({ message: 'No hay ninguna caja abierta para cerrar.' });
    }

    const cerrada = await prisma.caja.update({
      where: { id: activeCaja.id },
      data: {
        estado: 'CERRADA',
        montoCierre: Number(montoCierre),
        closedAt: new Date(),
      },
    });

    return res.json({ message: 'Caja cerrada con éxito.', caja: cerrada });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al cerrar caja', error: error.message });
  }
};
