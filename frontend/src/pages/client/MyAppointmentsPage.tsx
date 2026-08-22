import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar, Clock, Scissors, User, X, AlertCircle } from 'lucide-react';

interface Appointment {
  id: string;
  dateTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  discountApplied: string;
  isFifthCutPromo: boolean;
  stylist: {
    name: string;
  };
  service: {
    name: string;
    price: string;
    durationMin: number;
  };
}

export const MyAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/client/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error('Error al obtener mis citas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [refreshTrigger]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    try {
      await api.post(`/client/appointments/${id}/cancel`);
      alert('Reserva cancelada correctamente.');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cancelar la reserva.');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CONFIRMED':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Separar citas próximas de pasadas
  const now = new Date();
  const upcoming = appointments.filter((appt) => {
    const apptDate = new Date(appt.dateTime);
    return apptDate >= now && appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED';
  });

  const past = appointments.filter((appt) => {
    const apptDate = new Date(appt.dateTime);
    return apptDate < now || appt.status === 'CANCELLED' || appt.status === 'COMPLETED';
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <Calendar className="text-zinc-400" /> Mis Reservas
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Revisa tu agenda de citas programadas e historial de visitas.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando citas...</div>
      ) : (
        <div className="space-y-8">
          {/* Citas Próximas */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-white font-bold">Próximas Visitas</h3>
            {upcoming.length === 0 ? (
              <Card className="text-center py-8 border-zinc-900 bg-zinc-950">
                <AlertCircle size={20} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500 uppercase tracking-wider">No tienes citas próximas agendadas</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {upcoming.map((appt) => {
                  const dateStr = new Date(appt.dateTime).toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const timeStr = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <Card key={appt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white uppercase tracking-wider">{appt.service.name}</span>
                          <Badge variant={getStatusVariant(appt.status)}>{getStatusText(appt.status)}</Badge>
                          {appt.isFifthCutPromo && (
                            <span className="text-[9px] bg-white text-black font-bold uppercase px-1 py-0.5 tracking-wider border border-white">
                              🎁 GRATIS (5to Corte)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-zinc-600" /> {dateStr} a las {timeStr} ({appt.service.durationMin} min)
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-zinc-600" /> Barbero: {appt.stylist.name}
                          </span>
                        </div>
                        {appt.notes && (
                          <p className="text-xs text-zinc-500 border-l border-zinc-800 pl-2">"{appt.notes}"</p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-zinc-900 pt-3 sm:pt-0 justify-between">
                        <span className="font-mono text-white text-xs font-bold sm:mb-2">
                          Importe: ${Number(appt.service.price) - Number(appt.discountApplied)}
                        </span>
                        {(appt.status === 'CONFIRMED' || appt.status === 'PENDING') && (
                          <Button
                            onClick={() => handleCancel(appt.id)}
                            variant="danger"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <X size={12} /> Cancelar Cita
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial de Citas */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Visitas Pasadas / Canceladas</h3>
            {past.length === 0 ? (
              <Card className="text-center py-6 border-zinc-900 bg-zinc-950">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">No hay registro de citas pasadas</p>
              </Card>
            ) : (
              <div className="overflow-x-auto border border-zinc-900 bg-zinc-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Servicio</th>
                      <th className="p-3">Barbero</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {past.map((appt) => {
                      const dateStr = new Date(appt.dateTime).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      const price = Number(appt.service.price);
                      const discount = Number(appt.discountApplied);
                      const paid = price - discount;

                      return (
                        <tr key={appt.id} className="hover:bg-zinc-900/10 transition-colors">
                          <td className="p-3 font-mono text-zinc-500">{dateStr}</td>
                          <td className="p-3 font-bold text-zinc-300 uppercase tracking-wider">{appt.service.name}</td>
                          <td className="p-3 text-zinc-400">{appt.stylist.name}</td>
                          <td className="p-3 text-center">
                            <Badge variant={getStatusVariant(appt.status)}>{getStatusText(appt.status)}</Badge>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-300">Bs. {paid.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
