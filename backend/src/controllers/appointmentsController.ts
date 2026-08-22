import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middlewares/authGuard';
import { AvailabilityService } from '../services/availabilityService';
import { LoyaltyService } from '../services/loyaltyService';
import { EstadoCita, Rol } from '@prisma/client';

const mapStatusToEnglish = (status: string) => {
  if (status === 'PENDIENTE') return 'PENDING';
  if (status === 'CONFIRMADO') return 'CONFIRMED';
  if (status === 'COMPLETADO') return 'COMPLETED';
  if (status === 'CANCELADO') return 'CANCELLED';
  return status;
};

const mapStatusToSpanish = (status: string) => {
  if (status === 'PENDING') return 'PENDIENTE';
  if (status === 'CONFIRMED') return 'CONFIRMADO';
  if (status === 'COMPLETED') return 'COMPLETADO';
  if (status === 'CANCELLED') return 'CANCELADO';
  return status;
};

const mapCita = (c: any) => ({
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

export const getAvailability = async (req: AuthRequest, res: Response) => {
  const { stylistId, serviceId, date } = req.query;

  if (!stylistId || !serviceId || !date) {
    return res.status(400).json({ message: 'stylistId, serviceId y date son obligatorios' });
  }

  try {
    const slots = await AvailabilityService.getAvailableSlots(
      String(stylistId),
      String(serviceId),
      String(date)
    );
    return res.json(slots);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al calcular disponibilidad', error: error.message });
  }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });

  try {
    let whereClause: any = {};

    if (req.user.role === Rol.CLIENTE) {
      whereClause.usuarioId = req.user.id;
    }

    const appointments = await prisma.cita.findMany({
      where: whereClause,
      include: {
        usuario: true,
        estilista: true,
        servicio: true,
      },
      orderBy: { fechaHora: 'asc' },
    });

    return res.json(appointments.map(mapCita));
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al obtener citas', error: error.message });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });

  const { stylistId, serviceId, date, time, notes } = req.body;
  let targetUserId = req.user.id;
  if ((req.user.role === Rol.ADMIN || req.user.role === Rol.STAFF) && req.body.userId) {
    targetUserId = req.body.userId;
  }

  if (!stylistId || !serviceId || !date || !time) {
    return res.status(400).json({ message: 'stylistId, serviceId, date y time son obligatorios' });
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { id: targetUserId } });
    const service = await prisma.servicio.findUnique({ where: { id: serviceId } });

    if (!user) return res.status(404).json({ message: 'Cliente no encontrado' });
    if (!service || !service.isActive) return res.status(404).json({ message: 'Servicio no encontrado o inactivo' });

    const availableSlots = await AvailabilityService.getAvailableSlots(stylistId, serviceId, date);
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

    const appointment = await prisma.cita.create({
      data: {
        usuarioId: targetUserId,
        estilistaId: stylistId,
        servicioId: serviceId,
        fechaHora: startDateTime,
        fechaHoraFin: endDateTime,
        estado: EstadoCita.CONFIRMADO,
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al reservar la cita', error: error.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // status viene en inglés del front (e.g. COMPLETED)

  if (!status) {
    return res.status(400).json({ message: 'Estado no proporcionado' });
  }

  const translatedStatus = mapStatusToSpanish(status) as EstadoCita;

  try {
    const appointment = await prisma.cita.findUnique({
      where: { id },
      include: { usuario: true, servicio: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (appointment.estado === EstadoCita.COMPLETADO && translatedStatus === EstadoCita.COMPLETADO) {
      return res.status(400).json({ message: 'La cita ya fue completada previamente' });
    }

    const updatedAppointment = await prisma.cita.update({
      where: { id },
      data: { estado: translatedStatus },
    });

    if (translatedStatus === EstadoCita.COMPLETADO) {
      await LoyaltyService.processCompletedAppointment(id);
    }

    return res.json({
      message: `Cita actualizada a ${status} con éxito`,
      appointment: mapCita(updatedAppointment),
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al actualizar el estado de la cita', error: error.message });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  const { id } = req.params;

  try {
    const appointment = await prisma.cita.findUnique({ where: { id } });

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    if (req.user.role === Rol.CLIENTE && appointment.usuarioId !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar esta cita' });
    }

    if (appointment.estado === EstadoCita.COMPLETADO || appointment.estado === EstadoCita.CANCELADO) {
      return res.status(400).json({ message: `No se puede cancelar una cita en estado ${appointment.estado}` });
    }

    const updated = await prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.CANCELADO },
    });

    return res.json({ message: 'Cita cancelada con éxito', appointment: mapCita(updated) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al cancelar la cita', error: error.message });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { stylistId, serviceId, date, time, notes } = req.body;

  if (!stylistId || !serviceId || !date || !time) {
    return res.status(400).json({ message: 'stylistId, serviceId, date y time son obligatorios' });
  }

  try {
    const service = await prisma.servicio.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Servicio no encontrado o inactivo' });
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + service.duracionMin * 60000);

    const updated = await prisma.cita.update({
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al modificar la cita', error: error.message });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.cita.delete({
      where: { id },
    });
    return res.json({ message: 'Cita eliminada con éxito' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error al eliminar la cita', error: error.message });
  }
};
