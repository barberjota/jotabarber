import prisma from '../config/db';

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
}

export class AvailabilityService {
  /**
   * Genera los horarios disponibles para un estilista en una fecha específica para un servicio dado.
   */
  static async getAvailableSlots(
    stylistId: string,
    serviceId: string,
    dateStr: string // Formato "YYYY-MM-DD"
  ): Promise<string[]> {
    // 1. Obtener la duración del servicio
    const servicio = await prisma.servicio.findUnique({
      where: { id: serviceId },
    });

    if (!servicio || !servicio.isActive) {
      throw new Error('Servicio no encontrado o inactivo');
    }

    const duracionMin = servicio.duracionMin;

    // 2. Determinar el día de la semana para la fecha dada
    // Usamos el formato "YYYY-MM-DD" con el inicio del día para evitar problemas de desfase horario
    const targetDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

    // 3. Obtener el horario del estilista para ese día
    const schedule = await prisma.horarioEstilista.findFirst({
      where: {
        estilistaId: stylistId,
        diaSemana: dayOfWeek,
      },
    });

    if (!schedule) {
      // Si no tiene horario configurado, no está disponible este día
      return [];
    }

    // 4. Obtener citas existentes para el estilista en esa fecha (excluyendo canceladas)
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    const appointments = await prisma.cita.findMany({
      where: {
        estilistaId: stylistId,
        estado: {
          not: 'CANCELADO',
        },
        fechaHora: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 5. Convertir horas de agenda ("09:00") a minutos desde la medianoche
    const parseTimeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const formatMinutesToTime = (totalMinutes: number): string => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const workStart = parseTimeToMinutes(schedule.horaInicio);
    const workEnd = parseTimeToMinutes(schedule.horaFin);

    // Mapear citas existentes a intervalos en minutos
    const bookedIntervals = appointments.map((appt) => {
      const apptStart = Math.floor((appt.fechaHora.getTime() - startOfDay.getTime()) / 60000);
      const apptEnd = Math.floor((appt.fechaHoraFin.getTime() - startOfDay.getTime()) / 60000);
      return { start: apptStart, end: apptEnd };
    });

    // 6. Generar bloques de tiempo (intervalos de 30 minutos)
    const availableSlots: string[] = [];
    const interval = 30; // Minutos entre slots
    const now = new Date();
    const isToday = dateStr === now.toISOString().split('T')[0];

    for (let current = workStart; current + duracionMin <= workEnd; current += interval) {
      // Validar si el slot está en el pasado (solo si es la fecha de hoy)
      if (isToday) {
        const slotDateTime = new Date(startOfDay.getTime() + current * 60000);
        if (slotDateTime <= now) {
          continue; // Omitir slots pasados
        }
      }

      // Validar solapamiento con citas reservadas
      const slotEnd = current + duracionMin;
      const overlaps = bookedIntervals.some((booking) => {
        // Dos intervalos [A, B] y [X, Y] se solapan si A < Y y X < B
        return current < booking.end && slotEnd > booking.start;
      });

      if (!overlaps) {
        availableSlots.push(formatMinutesToTime(current));
      }
    }

    return availableSlots;
  }
}
