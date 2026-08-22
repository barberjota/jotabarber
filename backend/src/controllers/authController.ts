import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';
import { Rol } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-jotabarber';

const mapRole = (rol: Rol): string => {
  if (rol === Rol.CLIENTE) return 'CLIENT';
  return rol; // STAFF, ADMIN are the same in database and frontend
};

export const register = async (req: AuthRequest, res: Response) => {
  const { password, name, phone } = req.body;

  if (!password || !name || !phone) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const existingUser = await prisma.usuario.findFirst({
      where: {
        telefono: phone,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El teléfono ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.usuario.create({
      data: {
        password: hashedPassword,
        nombre: name,
        telefono: phone,
        rol: Rol.CLIENTE,
        saldoPuntos: 0,
        cortesCompletados: 0,
      },
    });

    const token = jwt.sign(
      { id: user.id, role: user.rol, name: user.nombre },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Teléfono y contraseña son requeridos' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { telefono: phone },
    });

    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.rol, name: user.nombre },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const user = await prisma.usuario.findUnique({
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
