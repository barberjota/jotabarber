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
  const { montoCierreEfectivo, montoCierreQR } = req.body;

  if (montoCierreEfectivo === undefined || Number(montoCierreEfectivo) < 0) {
    return res.status(400).json({ message: 'Monto de cierre de efectivo inválido.' });
  }
  if (montoCierreQR === undefined || Number(montoCierreQR) < 0) {
    return res.status(400).json({ message: 'Monto de cierre de QR inválido.' });
  }

  try {
    const activeCaja = await prisma.caja.findFirst({
      where: { estado: 'ABIERTA' },
    });

    if (!activeCaja) {
      return res.status(400).json({ message: 'No hay ninguna caja abierta para cerrar.' });
    }

    const totalCierre = Number(montoCierreEfectivo) + Number(montoCierreQR);

    const cerrada = await prisma.caja.update({
      where: { id: activeCaja.id },
      data: {
        estado: 'CERRADA',
        montoCierre: totalCierre,
        montoCierreEfectivo: Number(montoCierreEfectivo),
        montoCierreQR: Number(montoCierreQR),
        closedAt: new Date(),
      },
    });

    return res.json({ message: 'Caja cerrada con éxito.', caja: cerrada });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al cerrar caja', error: error.message });
  }
};

export const getCajasHistory = async (req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.caja.findMany({
      include: {
        usuario: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      history.map((c) => ({
        id: c.id,
        usuarioId: c.usuarioId,
        usuarioNombre: c.usuario.nombre,
        estado: c.estado,
        montoApertura: Number(c.montoApertura),
        montoEfectivo: Number(c.montoEfectivo),
        montoQR: Number(c.montoQR),
        montoCierre: c.montoCierre ? Number(c.montoCierre) : null,
        montoCierreEfectivo: c.montoCierreEfectivo ? Number(c.montoCierreEfectivo) : null,
        montoCierreQR: c.montoCierreQR ? Number(c.montoCierreQR) : null,
        createdAt: c.createdAt,
        closedAt: c.closedAt,
      }))
    );
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener historial de cajas', error: error.message });
  }
};

export const updateCaja = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { montoCierreEfectivo, montoCierreQR } = req.body;

  if (montoCierreEfectivo === undefined || Number(montoCierreEfectivo) < 0) {
    return res.status(400).json({ message: 'Monto de cierre de efectivo inválido.' });
  }
  if (montoCierreQR === undefined || Number(montoCierreQR) < 0) {
    return res.status(400).json({ message: 'Monto de cierre de QR inválido.' });
  }

  try {
    const caja = await prisma.caja.findUnique({ where: { id } });
    if (!caja) {
      return res.status(404).json({ message: 'Registro de caja no encontrado.' });
    }

    const totalCierre = Number(montoCierreEfectivo) + Number(montoCierreQR);

    const updated = await prisma.caja.update({
      where: { id },
      data: {
        montoCierre: totalCierre,
        montoCierreEfectivo: Number(montoCierreEfectivo),
        montoCierreQR: Number(montoCierreQR),
      },
    });

    return res.json({ message: 'Registro de caja modificado con éxito.', caja: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al modificar registro de caja', error: error.message });
  }
};

export const deleteCaja = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const caja = await prisma.caja.findUnique({ where: { id } });
    if (!caja) {
      return res.status(404).json({ message: 'Registro de caja no encontrado.' });
    }

    // Desvincular ventas
    await prisma.venta.updateMany({
      where: { cajaId: id },
      data: { cajaId: null },
    });

    await prisma.caja.delete({
      where: { id },
    });

    return res.json({ message: 'Registro de caja eliminado con éxito.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al eliminar caja del historial', error: error.message });
  }
};
