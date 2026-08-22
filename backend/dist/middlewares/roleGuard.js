"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
const roleGuard = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
        }
        next();
    };
};
exports.roleGuard = roleGuard;
