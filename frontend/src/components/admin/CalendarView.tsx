import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Calendar,
  User,
  Scissors,
  Check,
  X,
  Phone,
  UserCheck,
  MessageSquare,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react';

interface Appointment {
  id: string;
  dateTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  discountApplied: string;
  isFifthCutPromo: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  stylist: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    price: string;
    durationMin: number;
  };
}

interface Stylist {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: string;
  durationMin: number;
}

export const CalendarView: React.FC = () => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const editDateInputRef = useRef<HTMLInputElement>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    return localToday.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estados para Modificación de Cita
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editStylistId, setEditStylistId] = useState('');
  const [editServiceId, setEditServiceId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSlots, setEditSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const res = await api.get('/client/stylists');
        setStylists(res.data);
      } catch (err) {
        console.error('Error al obtener estilistas:', err);
      }
    };
    const fetchServices = async () => {
      try {
        const res = await api.get('/client/services');
        setServices(res.data);
      } catch (err) {
        console.error('Error al obtener servicios:', err);
      }
    };
    fetchStylists();
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error('Error al obtener citas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [refreshTrigger]);

  // Obtener slots disponibles cuando cambian datos de edición
  useEffect(() => {
    if (!editStylistId || !editServiceId || !editDate) return;

    const fetchEditSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get('/client/availability', {
          params: {
            stylistId: editStylistId,
            serviceId: editServiceId,
            date: editDate,
          },
        });
        setEditSlots(res.data);
      } catch (err) {
        console.error('Error al obtener disponibilidad para edición:', err);
        setEditSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchEditSlots();
  }, [editStylistId, editServiceId, editDate]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`¿Estás seguro de cambiar el estado de la cita a ${newStatus}?`)) return;
    try {
      await api.patch(`/admin/appointments/${id}/status`, { status: newStatus });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta cita?')) return;
    try {
      await api.post(`/admin/appointments/${id}/cancel`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cancelar cita');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar permanentemente esta cita de la base de datos? (Esta acción no se puede deshacer)')) return;
    try {
      await api.delete(`/admin/appointments/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar cita');
    }
  };

  const handleSendWhatsApp = (appt: Appointment) => {
    const dateParsed = new Date(appt.dateTime);
    const dateStr = dateParsed.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = dateParsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const message = `¡Hola, ${appt.user.name}! Tu cita en JotaBarber ha sido registrada con éxito.

Detalles de tu turno:
💈 Servicio: ${appt.service.name}
✂️ Barbero: ${appt.stylist.name}
📅 Fecha: ${dateStr}
⏰ Hora: ${timeStr}

¡Te esperamos para brindarte el mejor servicio! 💈`;

    // Dejar solo números en el teléfono
    const cleanPhone = appt.user.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleStartEdit = (appt: Appointment) => {
    const originalDate = new Date(appt.dateTime).toISOString().split('T')[0];
    const originalTime = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEditingAppt(appt);
    setEditStylistId(appt.stylist.id);
    setEditServiceId(appt.service.id);
    setEditDate(originalDate);
    setEditTime(originalTime);
    setEditNotes(appt.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;

    try {
      await api.put(`/admin/appointments/${editingAppt.id}`, {
        stylistId: editStylistId,
        serviceId: editServiceId,
        date: editDate,
        time: editTime,
        notes: editNotes,
      });
      setEditingAppt(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al modificar cita');
    }
  };

  // Filtrar citas según la fecha y el estilista seleccionado
  const filteredAppointments = appointments.filter((appt) => {
    const apptDateStr = new Date(appt.dateTime).toISOString().split('T')[0];
    const dateMatch = apptDateStr === selectedDate;
    const stylistMatch = selectedStylistId === 'all' || appt.stylist.id === selectedStylistId;
    return dateMatch && stylistMatch;
  });

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
        return 'Confirmado';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 bg-zinc-950 border border-zinc-800 p-4">
        <div className="flex-1">
          <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-medium">Filtrar por Fecha</label>
          <div className="relative">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 border-l border-zinc-800"
              title="Abrir Calendario"
            >
              <Calendar size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-medium">Filtrar por Barbero</label>
          <select
            value={selectedStylistId}
            onChange={(e) => setSelectedStylistId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
          >
            <option value="all">Todos los barberos</option>
            {stylists.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de citas */}
      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando citas...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-950 border border-zinc-800">
          <Calendar size={32} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-400 uppercase tracking-widest font-semibold">No hay citas registradas</p>
          <p className="text-xs text-zinc-600 mt-1">Para la fecha {selectedDate} y los filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
            Agenda del día: {filteredAppointments.length} cita(s)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {filteredAppointments.map((appt) => {
              const timeStr = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const endTimeStr = new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const price = Number(appt.service.price);
              const discount = Number(appt.discountApplied);
              const total = price - discount;

              return (
                <Card key={appt.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap gap-4 items-start">
                    {/* Hora */}
                    <div className="bg-white text-black p-3 text-center min-w-[70px]">
                      <div className="text-base font-bold font-mono">{timeStr}</div>
                      <div className="text-[9px] uppercase tracking-wider font-semibold border-t border-black mt-1 pt-1">
                        a {endTimeStr}
                      </div>
                    </div>

                    {/* Cliente y Detalles */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm uppercase tracking-wider">{appt.user.name}</span>
                        <Badge variant={getStatusVariant(appt.status)}>
                          {getStatusText(appt.status)}
                        </Badge>
                        {appt.isFifthCutPromo && (
                          <span className="bg-white text-black text-[9px] font-bold uppercase px-1 py-0.5 tracking-wider border border-white">
                            🎁 5to Corte Gratis
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-zinc-600" /> {appt.user.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors size={12} className="text-zinc-600" /> {appt.service.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-zinc-600" /> Barbero: {appt.stylist.name}
                        </span>
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-zinc-500 border-l border-zinc-800 pl-2 mt-1">
                          "{appt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones e Importe */}
                  <div className="flex md:flex-col justify-between w-full md:w-auto items-end gap-2 border-t md:border-t-0 border-zinc-900 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-medium">Cobro</span>
                      {discount > 0 ? (
                        <div>
                          <span className="text-xs line-through text-zinc-600 font-mono mr-1.5">Bs. {price.toFixed(2)}</span>
                          <span className="text-sm font-bold text-white font-mono">Bs. {total.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-white font-mono">Bs. {total.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {/* Fila superior: Cambios de Estado */}
                      <div className="flex gap-2">
                        {appt.status === 'CONFIRMED' && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                              variant="primary"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Check size={14} /> Completar
                            </Button>
                            <Button
                              onClick={() => handleCancelAppointment(appt.id)}
                              variant="danger"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <X size={14} /> Cancelar
                            </Button>
                          </>
                        )}
                        {appt.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <UserCheck size={14} /> Confirmar
                            </Button>
                            <Button
                              onClick={() => handleCancelAppointment(appt.id)}
                              variant="danger"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <X size={14} /> Cancelar
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Fila inferior: Utilidades (WhatsApp, Modificar, Eliminar) */}
                      <div className="flex gap-1.5 mt-1">
                        <button
                          onClick={() => handleSendWhatsApp(appt)}
                          className="p-1.5 bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center justify-center border border-green-700"
                          title="Enviar Confirmación por WhatsApp"
                        >
                          <MessageSquare size={13} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(appt)}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center"
                          title="Modificar Cita"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="p-1.5 bg-red-950/20 border border-red-900/50 text-red-400 hover:bg-red-900 hover:text-white transition-colors flex items-center justify-center"
                          title="Eliminar permanentemente de la BD"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para Modificar Cita */}
      {editingAppt && (
        <Modal
          isOpen={!!editingAppt}
          onClose={() => setEditingAppt(null)}
          title="Modificar Cita"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Barbero</label>
              <select
                value={editStylistId}
                onChange={(e) => {
                  setEditStylistId(e.target.value);
                  setEditTime('');
                }}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
              >
                {stylists.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Servicio</label>
              <select
                value={editServiceId}
                onChange={(e) => {
                  setEditServiceId(e.target.value);
                  setEditTime('');
                }}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
              >
                {services.map((sv) => (
                  <option key={sv.id} value={sv.id}>
                    {sv.name} (Bs. {Number(sv.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Fecha</label>
              <div className="relative">
                <input
                  ref={editDateInputRef}
                  type="date"
                  value={editDate}
                  onChange={(e) => {
                    setEditDate(e.target.value);
                    setEditTime('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => editDateInputRef.current?.showPicker()}
                  className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 border-l border-zinc-800"
                  title="Abrir Calendario"
                >
                  <Calendar size={14} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1.5 font-medium flex items-center gap-1 justify-center">
                <Clock size={12} /> Horario de Turno
              </label>
              {loadingSlots ? (
                <div className="text-center text-xs text-zinc-500 py-3 uppercase tracking-wider">Verificando turnos...</div>
              ) : editSlots.length === 0 ? (
                <div className="text-center text-xs text-zinc-600 py-3 border border-dashed border-zinc-800">
                  No hay horarios disponibles para los filtros seleccionados.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-zinc-900 p-2 bg-black/40">
                  {editSlots.map((slot) => {
                    const isSel = slot === editTime;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setEditTime(slot)}
                        className={`py-1.5 text-center font-mono text-[10px] border transition-all ${
                          isSel
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Notas</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none h-16 resize-none"
                placeholder="Añade notas para el barbero..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAppt(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!editTime}
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
