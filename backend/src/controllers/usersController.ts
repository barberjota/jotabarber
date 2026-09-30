import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';
import { Rol } from '@prisma/client';

export const getUsers = async (req: Request, res: Response) => {
  const { q, role } = req.query;

  try {
    const whereClause: any = {};

    if (role && typeof role === 'string' && role !== 'TODOS') {
      if (role === 'STAFF' || role === 'ADMIN' || role === 'CLIENTE') {
        whereClause.rol = role as Rol;
      }
    }

    if (q && typeof q === 'string') {
      whereClause.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q } },
      ];
    }

    const users = await prisma.usuario.findMany({
      where: whereClause,
      include: {
        estilista: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      name: u.nombre,
      phone: u.telefono,
      role: u.rol, // ADMIN, STAFF, CLIENTE
      pointsBalance: u.saldoPuntos,
      completedCuts: u.cortesCompletados,
      stylistId: u.estilista?.id || null,
      stylistName: u.estilista?.nombre || null,
      createdAt: u.createdAt,
    }));

    return res.json(mapped);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, phone, password, role, stylistId } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Nombre, teléfono y contraseña son requeridos' });
  }

  const userRole = role === 'ADMIN' ? Rol.ADMIN : role === 'STAFF' ? Rol.STAFF : Rol.CLIENTE;

  try {
    const existing = await prisma.usuario.findUnique({
      where: { telefono: phone },
    });

    if (existing) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado por otro usuario' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.usuario.create({
        data: {
          nombre: name,
          telefono: phone,
          password: hashedPassword,
          rol: userRole,
        },
      });

      // Si es STAFF y se pasó un stylistId, vincularlo
      if (userRole === Rol.STAFF) {
        if (stylistId) {
          await tx.estilista.update({
            where: { id: stylistId },
            data: { usuarioId: createdUser.id },
          });
        } else {
          // Si no se pasó stylistId, creamos automáticamente un perfil de Estilista/Barbero para él
          await tx.estilista.create({
            data: {
              nombre: name,
              usuarioId: createdUser.id,
              isActive: true,
            },
          });
        }
      }

      return tx.usuario.findUnique({
        where: { id: createdUser.id },
        include: { estilista: true },
      });
    });

    return res.status(201).json({
      message: 'Usuario creado con éxito',
      user: {
        id: user?.id,
        name: user?.nombre,
        phone: user?.telefono,
        role: user?.rol,
        stylistId: user?.estilista?.id || null,
        stylistName: user?.estilista?.nombre || null,
        createdAt: user?.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone, password, role, stylistId } = req.body;

  try {
    const existing = await prisma.usuario.findUnique({
      where: { id },
      include: { estilista: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (phone && phone !== existing.telefono) {
      const phoneTaken = await prisma.usuario.findUnique({
        where: { telefono: phone },
      });
      if (phoneTaken) {
        return res.status(400).json({ message: 'El teléfono ya está en uso por otro usuario' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.nombre = name;
    if (phone !== undefined) updateData.telefono = phone;
    if (role !== undefined) {
      updateData.rol = role === 'ADMIN' ? Rol.ADMIN : role === 'STAFF' ? Rol.STAFF : Rol.CLIENTE;
    }
    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userRes = await tx.usuario.update({
        where: { id },
        data: updateData,
      });

      // Manejo del vínculo con estilista
      if (stylistId !== undefined) {
        // Desvincular estilista actual si tenía otro
        if (existing.estilista && existing.estilista.id !== stylistId) {
          await tx.estilista.update({
            where: { id: existing.estilista.id },
            data: { usuarioId: null },
          });
        }

        if (stylistId) {
          await tx.estilista.update({
            where: { id: stylistId },
            data: { usuarioId: id },
          });
        }
      }

      return tx.usuario.findUnique({
        where: { id },
        include: { estilista: true },
      });
    });

    return res.json({
      message: 'Usuario actualizado con éxito',
      user: {
        id: updated?.id,
        name: updated?.nombre,
        phone: updated?.telefono,
        role: updated?.rol,
        stylistId: updated?.estilista?.id || null,
        stylistName: updated?.estilista?.nombre || null,
        createdAt: updated?.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (req.user && req.user.id === id) {
    return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta activa de administrador' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { id },
      include: {
        estilista: true,
        citas: true,
        ventas: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      // Si está vinculado a un estilista, desvincularlo primero
      if (user.estilista) {
        await tx.estilista.update({
          where: { id: user.estilista.id },
          data: { usuarioId: null },
        });
      }

      await tx.usuario.delete({
        where: { id },
      });
    });

    return res.json({ message: 'Usuario eliminado con éxito' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};
