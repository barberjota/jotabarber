import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: Rol;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-jotabarber';

export const authGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acceso no proporcionado o inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email?: string;
      role: Rol;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token de acceso expirado o inválido' });
  }
};
