"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBooking = exports.updateBooking = exports.cancelBooking = exports.updateBookingStatus = exports.createBooking = exports.getBookings = exports.getAvailability = void 0;
const db_1 = __importDefault(require("../config/db"));
const availabilityService_1 = require("../services/availabilityService");
const loyaltyService_1 = require("../services/loyaltyService");
const client_1 = require("@prisma/client");
const mapStatusToEnglish = (status) => {
    if (status === 'PENDIENTE')
        return 'PENDING';
    if (status === 'CONFIRMADO')
        return 'CONFIRMED';
    if (status === 'COMPLETADO')
        return 'COMPLETED';
    if (status === 'CANCELADO')
        return 'CANCELLED';
    return status;
};
const mapStatusToSpanish = (status) => {
    if (status === 'PENDING')
        return 'PENDIENTE';
    if (status === 'CONFIRMED')
        return 'CONFIRMADO';
    if (status === 'COMPLETED')
        return 'COMPLETADO';
    if (status === 'CANCELLED')
        return 'CANCELADO';
    return status;
};
const mapCita = (c) => ({
    id: c.id,
    userId: c.usuarioId,
    stylistId: c.estilistaId,
    serviceId: c.servicioId,
    dateTime: c.fechaHora,
    endTime: c.fechaHoraFin,
    status: mapStatusToEnglish(c.estado),
    discountApplied: c.descuentoAplicado,
    isFifthCutPromo: c.esPromoQuintoCorte,
    notes: c.notes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    user: c.usuario ? {
        id: c.usuario.id,
        name: c.usuario.nombre,
        email: '',
        phone: c.usuario.telefono,
        completedCuts: c.usuario.cortesCompletados,
        pointsBalance: c.usuario.saldoPuntos,
    } : undefined,
    stylist: c.estilista ? {
        id: c.estilista.id,
        name: c.estilista.nombre,
    } : undefined,
    service: c.servicio ? {
        id: c.servicio.id,
        name: c.servicio.nombre,
        price: c.servicio.precio,
        durationMin: c.servicio.duracionMin,
    } : undefined,
});
const getAvailability = async (req, res) => {
    const { stylistId, serviceId, date } = req.query;
    if (!stylistId || !serviceId || !date) {
        return res.status(400).json({ message: 'stylistId, serviceId y date son obligatorios' });
    }
    try {
        const slots = await availabilityService_1.AvailabilityService.getAvailableSlots(String(stylistId), String(serviceId), String(date));
        return res.json(slots);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al calcular disponibilidad', error: error.message });
    }
};
exports.getAvailability = getAvailability;
const getBookings = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'No autenticado' });
    try {
        let whereClause = {};
        if (req.user.role === client_1.Rol.CLIENTE) {
            whereClause.usuarioId = req.user.id;
        }
        const appointments = await db_1.default.cita.findMany({
            where: whereClause,
            include: {
                usuario: true,
                estilista: true,
                servicio: true,
            },
            orderBy: { fechaHora: 'asc' },
        });
        return res.json(appointments.map(mapCita));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener citas', error: error.message });
    }
};
exports.getBookings = getBookings;
const createBooking = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'No autenticado' });
    const { stylistId, serviceId, date, time, notes } = req.body;
    let targetUserId = req.user.id;
    if ((req.user.role === client_1.Rol.ADMIN || req.user.role === client_1.Rol.STAFF) && req.body.userId) {
        targetUserId = req.body.userId;
    }
    if (!stylistId || !serviceId || !date || !time) {
        return res.status(400).json({ message: 'stylistId, serviceId, date y time son obligatorios' });
    }
    try {
        const user = await db_1.default.usuario.findUnique({ where: { id: targetUserId } });
        const service = await db_1.default.servicio.findUnique({ where: { id: serviceId } });
        if (!user)
            return res.status(404).json({ message: 'Cliente no encontrado' });
        if (!service || !service.isActive)
            return res.status(404).json({ message: 'Servicio no encontrado o inactivo' });
        const availableSlots = await availabilityService_1.AvailabilityService.getAvailableSlots(stylistId, serviceId, date);
        if (!availableSlots.includes(time)) {
            return res.status(400).json({ message: 'El horario seleccionado ya no está disponible' });
        }
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + service.duracionMin * 60000);
        let esPromoQuintoCorte = false;
        let descuentoAplicado = 0;
        if (service.aplicaFidelidad && user.cortesCompletados === 4) {
            esPromoQuintoCorte = true;
            descuentoAplicado = Number(service.precio);
        }
        const appointment = await db_1.default.cita.create({
            data: {
                usuarioId: targetUserId,
                estilistaId: stylistId,
                servicioId: serviceId,
                fechaHora: startDateTime,
                fechaHoraFin: endDateTime,
                estado: client_1.EstadoCita.CONFIRMADO,
                esPromoQuintoCorte,
                descuentoAplicado,
                notas: notes,
            },
            include: {
                servicio: true,
                estilista: true,
            },
        });
        return res.status(201).json(mapCita(appointment));
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al reservar la cita', error: error.message });
    }
};
exports.createBooking = createBooking;
const updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // status viene en inglés del front (e.g. COMPLETED)
    if (!status) {
        return res.status(400).json({ message: 'Estado no proporcionado' });
    }
    const translatedStatus = mapStatusToSpanish(status);
    try {
        const appointment = await db_1.default.cita.findUnique({
            where: { id },
            include: { usuario: true, servicio: true },
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        if (appointment.estado === client_1.EstadoCita.COMPLETADO && translatedStatus === client_1.EstadoCita.COMPLETADO) {
            return res.status(400).json({ message: 'La cita ya fue completada previamente' });
        }
        const updatedAppointment = await db_1.default.cita.update({
            where: { id },
            data: { estado: translatedStatus },
        });
        if (translatedStatus === client_1.EstadoCita.COMPLETADO) {
            await loyaltyService_1.LoyaltyService.processCompletedAppointment(id);
        }
        return res.json({
            message: `Cita actualizada a ${status} con éxito`,
            appointment: mapCita(updatedAppointment),
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el estado de la cita', error: error.message });
    }
};
exports.updateBookingStatus = updateBookingStatus;
const cancelBooking = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'No autenticado' });
    const { id } = req.params;
    try {
        const appointment = await db_1.default.cita.findUnique({ where: { id } });
        if (!appointment) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        if (req.user.role === client_1.Rol.CLIENTE && appointment.usuarioId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para cancelar esta cita' });
        }
        if (appointment.estado === client_1.EstadoCita.COMPLETADO || appointment.estado === client_1.EstadoCita.CANCELADO) {
            return res.status(400).json({ message: `No se puede cancelar una cita en estado ${appointment.estado}` });
        }
        const updated = await db_1.default.cita.update({
            where: { id },
            data: { estado: client_1.EstadoCita.CANCELADO },
        });
        return res.json({ message: 'Cita cancelada con éxito', appointment: mapCita(updated) });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al cancelar la cita', error: error.message });
    }
};
exports.cancelBooking = cancelBooking;
const updateBooking = async (req, res) => {
    const { id } = req.params;
    const { stylistId, serviceId, date, time, notes } = req.body;
    if (!stylistId || !serviceId || !date || !time) {
        return res.status(400).json({ message: 'stylistId, serviceId, date y time son obligatorios' });
    }
    try {
        const service = await db_1.default.servicio.findUnique({ where: { id: serviceId } });
        if (!service || !service.isActive) {
            return res.status(404).json({ message: 'Servicio no encontrado o inactivo' });
        }
        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + service.duracionMin * 60000);
        const updated = await db_1.default.cita.update({
            where: { id },
            data: {
                estilistaId: stylistId,
                servicioId: serviceId,
                fechaHora: startDateTime,
                fechaHoraFin: endDateTime,
                notas: notes,
            },
        });
        return res.json({ message: 'Cita modificada con éxito', appointment: mapCita(updated) });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al modificar la cita', error: error.message });
    }
};
exports.updateBooking = updateBooking;
const deleteBooking = async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.cita.delete({
            where: { id },
        });
        return res.json({ message: 'Cita eliminada con éxito' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar la cita', error: error.message });
    }
};
exports.deleteBooking = deleteBooking;
