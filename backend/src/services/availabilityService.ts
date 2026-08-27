import prisma from '../config/db';

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
}

export class AvailabilityService {
  /**
   * Genera los horarios disponibles para un estilista en una fecha específica para un servicio dado.
   * Utiliza el huso horario de Bolivia (UTC-4) para evitar solapamientos y desfases horarios.
   */
  static async getAvailableSlots(
    stylistId: string,
    serviceId: string,
    dateStr: string // Formato "YYYY-MM-DD"
  ): Promise<string[]> {
    // Bolivia (UTC-4)
    const timezoneOffset = "-04:00";

    // 1. Obtener la duración del servicio
    const servicio = await prisma.servicio.findUnique({
      where: { id: serviceId },
    });

    if (!servicio || !servicio.isActive) {
      throw new Error('Servicio no encontrado o inactivo');
    }

    const duracionMin = servicio.duracionMin;

    // 2. Determinar el día de la semana para la fecha dada en Bolivia
    // Parseando como YYYY-MM-DDT00:00:00-04:00 obtenemos exactamente ese día calendario
    const startOfDay = new Date(`${dateStr}T00:00:00${timezoneOffset}`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999${timezoneOffset}`);
    const dayOfWeek = startOfDay.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

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

    // Mapear citas existentes a intervalos en minutos de ese día
    const bookedIntervals = appointments.map((appt) => {
      const apptStart = Math.floor((appt.fechaHora.getTime() - startOfDay.getTime()) / 60000);
      const apptEnd = Math.floor((appt.fechaHoraFin.getTime() - startOfDay.getTime()) / 60000);
      return { start: apptStart, end: apptEnd };
    });

    // 6. Generar bloques de tiempo (intervalos de 30 minutos)
    const availableSlots: string[] = [];
    const interval = 30; // Minutos entre slots
    
    // Obtener la fecha actual en Bolivia
    const nowBolivia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));
    const year = nowBolivia.getFullYear();
    const month = String(nowBolivia.getMonth() + 1).padStart(2, '0');
    const day = String(nowBolivia.getDate()).padStart(2, '0');
    const boliviaDateStr = `${year}-${month}-${day}`;
    
    const isToday = dateStr === boliviaDateStr;

    for (let current = workStart; current + duracionMin <= workEnd; current += interval) {
      // Validar si el slot está en el pasado (solo si es la fecha de hoy en Bolivia)
      if (isToday) {
        const slotDateTime = new Date(startOfDay.getTime() + current * 60000);
        // Comparación en milisegundos reales (UTC) contra el instante actual real (new Date())
        if (slotDateTime.getTime() <= new Date().getTime()) {
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
