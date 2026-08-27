import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';
import { LoyaltyService } from '../services/loyaltyService';
import { Rol } from '@prisma/client';

export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const sales = await prisma.venta.findMany({
      include: {
        usuario: { select: { id: true, nombre: true, telefono: true } },
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
        estado: s.estado,
        metodoPago: s.metodoPago,
        cajaId: s.cajaId,
        createdAt: s.createdAt,
        user: s.usuario
          ? {
              id: s.usuario.id,
              name: s.usuario.nombre,
              phone: s.usuario.telefono,
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
  const { userId, items, discount, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto' });
  }

  const method = paymentMethod || 'EFECTIVO';
  if (method !== 'EFECTIVO' && method !== 'QR') {
    return res.status(400).json({ message: 'Método de pago inválido (debe ser EFECTIVO o QR)' });
  }

  // Validar caja abierta
  const activeCaja = await prisma.caja.findFirst({
    where: { estado: 'ABIERTA' },
  });

  if (!activeCaja) {
    return res.status(400).json({ message: 'No hay ninguna caja abierta. Debe abrir la caja para poder cobrar.' });
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

      const nowBolivia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));
      const year = nowBolivia.getFullYear();
      const month = String(nowBolivia.getMonth() + 1).padStart(2, '0');
      const day = String(nowBolivia.getDate()).padStart(2, '0');
      const hours = String(nowBolivia.getHours()).padStart(2, '0');
      const minutes = String(nowBolivia.getMinutes()).padStart(2, '0');
      const ventaFecha = `${year}-${month}-${day}`;
      const ventaHora = `${hours}:${minutes}`;

      const sale = await tx.venta.create({
        data: {
          usuarioId: userId || null,
          subtotal,
          descuento: discAmount,
          total,
          puntosGanados: pointsAwarded,
          puntosUsados: 0,
          estado: 'COMPLETADO',
          metodoPago: method,
          cajaId: activeCaja.id,
          fecha: ventaFecha,
          hora: ventaHora,
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

      // Sumar al saldo de la caja activa
      if (method === 'EFECTIVO') {
        await tx.caja.update({
          where: { id: activeCaja.id },
          data: {
            montoEfectivo: {
              increment: total,
            },
          },
        });
      } else {
        await tx.caja.update({
          where: { id: activeCaja.id },
          data: {
            montoQR: {
              increment: total,
            },
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
    return res.status(500).json({ message: error.message || 'Error al procesar la venta', error: error.message });
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

      const nowBolivia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));
      const year = nowBolivia.getFullYear();
      const month = String(nowBolivia.getMonth() + 1).padStart(2, '0');
      const day = String(nowBolivia.getDate()).padStart(2, '0');
      const hours = String(nowBolivia.getHours()).padStart(2, '0');
      const minutes = String(nowBolivia.getMinutes()).padStart(2, '0');
      const ventaFecha = `${year}-${month}-${day}`;
      const ventaHora = `${hours}:${minutes}`;

      const sale = await tx.venta.create({
        data: {
          usuarioId: userId,
          subtotal,
          descuento: 0,
          total,
          puntosGanados: 0, // Se sumarán al cobrar
          puntosUsados: 0,
          estado: 'PENDIENTE',
          fecha: ventaFecha,
          hora: ventaHora,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

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

export const deleteSale = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const sale = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return res.status(404).json({ message: 'Venta o pedido no encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      // Devolver stock de los productos siempre que se elimina (especialmente si era PENDIENTE)
      for (const item of sale.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        });
      }

      // Si estaba completada y tenía puntos acumulados, restárselos al cliente
      if (sale.estado === 'COMPLETADO' && sale.usuarioId && sale.puntosGanados > 0) {
        await tx.usuario.update({
          where: { id: sale.usuarioId },
          data: {
            saldoPuntos: {
              decrement: sale.puntosGanados,
            },
          },
        });

        await tx.historialFidelidad.create({
          data: {
            usuarioId: sale.usuarioId,
            puntos: -sale.puntosGanados,
            motivo: `Puntos revertidos por eliminación de venta (Venta ID: ${sale.id})`,
          },
        });

        // Restar de la caja si estaba asociada
        if (sale.cajaId && sale.metodoPago) {
          const field = sale.metodoPago === 'EFECTIVO' ? 'montoEfectivo' : 'montoQR';
          await tx.caja.update({
            where: { id: sale.cajaId },
            data: {
              [field]: {
                decrement: sale.total,
              },
            },
          });
        }
      }

      await tx.venta.delete({
        where: { id },
      });
    });

    return res.json({ message: 'Pedido/Venta eliminado con éxito y stock restaurado.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al eliminar el registro', error: error.message });
  }
};

export const updateSale = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ message: 'Debe proveer una lista de items.' });
  }

  try {
    const sale = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    if (sale.estado !== 'PENDIENTE') {
      return res.status(400).json({ message: 'Solo se pueden modificar pedidos pendientes.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Devolver stock anterior
      for (const oldItem of sale.items) {
        await tx.producto.update({
          where: { id: oldItem.productoId },
          data: { stock: { increment: oldItem.cantidad } },
        });
      }

      // 2. Limpiar items antiguos
      await tx.itemVenta.deleteMany({
        where: { ventaId: id },
      });

      // 3. Crear nuevos items y descontar stock
      let subtotal = 0;
      const newItemsData = [];

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

        // Descontar
        await tx.producto.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        newItemsData.push({
          productoId: item.productId,
          cantidad: item.quantity,
          precioUnit: price,
        });
      }

      // 4. Actualizar venta
      await tx.venta.update({
        where: { id },
        data: {
          subtotal,
          total: subtotal,
          items: {
            create: newItemsData,
          },
        },
      });
    });

    return res.json({ message: 'Pedido actualizado con éxito.' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error al actualizar el pedido', error: error.message });
  }
};

export const checkoutOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  if (!paymentMethod || (paymentMethod !== 'EFECTIVO' && paymentMethod !== 'QR')) {
    return res.status(400).json({ message: 'Método de pago inválido (debe ser EFECTIVO o QR)' });
  }

  // Validar caja abierta
  const activeCaja = await prisma.caja.findFirst({
    where: { estado: 'ABIERTA' },
  });

  if (!activeCaja) {
    return res.status(400).json({ message: 'No hay ninguna caja abierta. Debe abrir la caja para poder cobrar.' });
  }

  try {
    const sale = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (sale.estado !== 'PENDIENTE') {
      return res.status(400).json({ message: 'El pedido ya fue cobrado o cancelado.' });
    }

    const totalVal = Number(sale.total);
    const pointsAwarded = Math.floor(totalVal);

    await prisma.$transaction(async (tx) => {
      const nowBolivia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));
      const year = nowBolivia.getFullYear();
      const month = String(nowBolivia.getMonth() + 1).padStart(2, '0');
      const day = String(nowBolivia.getDate()).padStart(2, '0');
      const hours = String(nowBolivia.getHours()).padStart(2, '0');
      const minutes = String(nowBolivia.getMinutes()).padStart(2, '0');
      const checkoutFecha = `${year}-${month}-${day}`;
      const checkoutHora = `${hours}:${minutes}`;

      // 1. Cambiar estado, metodoPago, cajaId y puntos ganados con fecha y hora
      await tx.venta.update({
        where: { id },
        data: {
          estado: 'COMPLETADO',
          metodoPago: paymentMethod,
          cajaId: activeCaja.id,
          puntosGanados: pointsAwarded,
          fecha: checkoutFecha,
          hora: checkoutHora,
        },
      });

      // 2. Sumar puntos al cliente si tiene usuarioId
      if (sale.usuarioId && pointsAwarded > 0) {
        await tx.usuario.update({
          where: { id: sale.usuarioId },
          data: {
            saldoPuntos: {
              increment: pointsAwarded,
            },
          },
        });

        await tx.historialFidelidad.create({
          data: {
            usuarioId: sale.usuarioId,
            puntos: pointsAwarded,
            motivo: `Puntos ganados por compra de productos (Venta ID: ${sale.id})`,
          },
        });
      }

      // 3. Registrar monto en la caja activa
      if (paymentMethod === 'EFECTIVO') {
        await tx.caja.update({
          where: { id: activeCaja.id },
          data: {
            montoEfectivo: {
              increment: totalVal,
            },
          },
        });
      } else {
        await tx.caja.update({
          where: { id: activeCaja.id },
          data: {
            montoQR: {
              increment: totalVal,
            },
          },
        });
      }
    });

    return res.json({ message: 'Pedido cobrado con éxito.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al cobrar el pedido', error: error.message });
  }
};
