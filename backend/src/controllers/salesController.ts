import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';
import { LoyaltyService } from '../services/loyaltyService';
import { Rol } from '@prisma/client';

export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const sales = await prisma.venta.findMany({
      include: {
        usuario: { select: { id: true, nombre: true } },
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      sales.map((s) => ({
        id: s.id,
        userId: s.usuarioId,
        appointmentId: s.citaId,
        subtotal: s.subtotal,
        discount: s.descuento,
        total: s.total,
        pointsAwarded: s.puntosGanados,
        pointsUsed: s.puntosUsados,
        createdAt: s.createdAt,
        user: s.usuario
          ? {
              id: s.usuario.id,
              name: s.usuario.nombre,
              email: '',
            }
          : null,
        items: s.items.map((i: any) => ({
          id: i.id,
          productId: i.productoId,
          quantity: i.cantidad,
          unitPrice: i.precioUnit,
          product: i.producto
            ? {
                id: i.producto.id,
                name: i.producto.nombre,
                price: i.producto.precio,
              }
            : null,
        })),
      }))
    );
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

export const createSale = async (req: AuthRequest, res: Response) => {
  const { userId, items, discount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto' });
  }

  try {
    const saleResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsToCreate = [];

      for (const item of items) {
        const product = await tx.producto.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new Error(`Producto ${item.productId} no encontrado o inactivo`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.nombre} (Stock: ${product.stock})`);
        }

        const price = Number(product.precio);
        subtotal += price * item.quantity;

        await tx.producto.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        saleItemsToCreate.push({
          productoId: item.productId,
          cantidad: item.quantity,
          precioUnit: price,
        });
      }

      const discAmount = discount ? Number(discount) : 0;
      const total = Math.max(0, subtotal - discAmount);

      const pointsAwarded = userId ? Math.floor(total) : 0;

      const sale = await tx.venta.create({
        data: {
          usuarioId: userId || null,
          subtotal,
          descuento: discAmount,
          total,
          puntosGanados: pointsAwarded,
          puntosUsados: 0,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      if (userId && pointsAwarded > 0) {
        await tx.usuario.update({
          where: { id: userId },
          data: {
            saldoPuntos: {
              increment: pointsAwarded,
            },
          },
        });

        await tx.historialFidelidad.create({
          data: {
            usuarioId: userId,
            puntos: pointsAwarded,
            motivo: `Puntos ganados por compra POS (Venta ID: ${sale.id})`,
          },
        });
      }

      return sale;
    });

    return res.status(201).json({
      id: saleResult.id,
      userId: saleResult.usuarioId,
      subtotal: saleResult.subtotal,
      discount: saleResult.descuento,
      total: saleResult.total,
      pointsAwarded: saleResult.puntosGanados,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al procesar la venta', error: error.message });
  }
};

export const redeemProduct = async (req: AuthRequest, res: Response) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'userId y productId son obligatorios' });
  }

  try {
    await LoyaltyService.redeemProductWithPoints(userId, productId, quantity || 1);
    return res.json({ message: 'Canje de producto con puntos realizado con éxito' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al canjear el producto', error: error.message });
  }
};

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalSalesSum = await prisma.venta.aggregate({
      _sum: { total: true },
    });

    const appointmentsCount = await prisma.cita.count({
      where: { estado: 'COMPLETADO' },
    });

    const pendingAppointmentsCount = await prisma.cita.count({
      where: { estado: 'CONFIRMADO' },
    });

    const clientsCount = await prisma.usuario.count({
      where: { rol: Rol.CLIENTE },
    });

    const pointsRedeemedSum = await prisma.historialFidelidad.aggregate({
      where: {
        puntos: { lt: 0 },
      },
      _sum: { puntos: true },
    });

    const stylists = await prisma.estilista.findMany({
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            citas: {
              where: { estado: 'COMPLETADO' },
            },
          },
        },
      },
    });

    const topClients = await prisma.usuario.findMany({
      where: { rol: Rol.CLIENTE },
      select: {
        id: true,
        nombre: true,
        saldoPuntos: true,
        cortesCompletados: true,
        _count: {
          select: {
            citas: {
              where: { estado: 'COMPLETADO' },
            },
          },
        },
      },
      orderBy: { saldoPuntos: 'desc' },
      take: 5,
    });

    const recentSales = await prisma.venta.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: { select: { nombre: true } },
      },
    });

    return res.json({
      revenue: Number(totalSalesSum._sum.total || 0),
      completedServices: appointmentsCount,
      pendingServices: pendingAppointmentsCount,
      totalClients: clientsCount,
      pointsRedeemed: Math.abs(pointsRedeemedSum._sum.puntos || 0),
      stylistMetrics: stylists.map((s) => ({
        name: s.nombre,
        completedCount: s._count.citas,
      })),
      topClients: topClients.map((c) => ({
        name: c.nombre,
        points: c.saldoPuntos,
        completedCuts: c.cortesCompletados,
        totalVisits: c._count.citas,
      })),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        clientName: s.usuario ? s.usuario.nombre : 'Cliente General',
        total: Number(s.total),
        date: s.createdAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener métricas del panel', error: error.message });
  }
};

export const createPublicOrder = async (req: AuthRequest, res: Response) => {
  const { clientName, clientPhone, items } = req.body;

  if (!clientName || !clientPhone) {
    return res.status(400).json({ message: 'Nombre y teléfono son obligatorios' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto' });
  }

  try {
    // 1. Buscar o registrar al usuario por su número de teléfono
    let userObj = await prisma.usuario.findUnique({ where: { telefono: clientPhone } });
    if (!userObj) {
      userObj = await prisma.usuario.create({
        data: {
          nombre: clientName,
          telefono: clientPhone,
          password: '$2b$10$Z3BiaXNoMTIzNDU2Nzg5MGFiY2RlZg==', // Hash genérico
          rol: Rol.CLIENTE,
        },
      });
    } else {
      if (userObj.nombre !== clientName) {
        userObj = await prisma.usuario.update({
          where: { id: userObj.id },
          data: { nombre: clientName },
        });
      }
    }

    const userId = userObj.id;

    const saleResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsToCreate = [];

      for (const item of items) {
        const product = await tx.producto.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new Error(`Producto ${item.productId} no encontrado o inactivo`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.nombre} (Disponibles: ${product.stock})`);
        }

        const price = Number(product.precio);
        subtotal += price * item.quantity;

        // Descontar stock
        await tx.producto.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        saleItemsToCreate.push({
          productoId: item.productId,
          cantidad: item.quantity,
          precioUnit: price,
        });
      }

      const total = subtotal;
      const pointsAwarded = Math.floor(total);

      const sale = await tx.venta.create({
        data: {
          usuarioId: userId,
          subtotal,
          descuento: 0,
          total,
          puntosGanados: pointsAwarded,
          puntosUsados: 0,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // Sumar puntos de fidelidad acumulados
      if (pointsAwarded > 0) {
        await tx.usuario.update({
          where: { id: userId },
          data: {
            saldoPuntos: {
              increment: pointsAwarded,
            },
          },
        });

        await tx.historialFidelidad.create({
          data: {
            usuarioId: userId,
            puntos: pointsAwarded,
            motivo: `Puntos ganados por reserva de productos (Venta ID: ${sale.id})`,
          },
        });
      }

      return sale;
    });

    return res.status(201).json({
      message: 'Pedido reservado con éxito',
      saleId: saleResult.id,
      total: saleResult.total,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error al procesar el pedido', error: error.message });
  }
};
