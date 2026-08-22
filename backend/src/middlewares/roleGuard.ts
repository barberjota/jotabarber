import { Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
import { AuthRequest } from './authGuard';

export const roleGuard = (allowedRoles: Rol[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }

    next();
  };
};
