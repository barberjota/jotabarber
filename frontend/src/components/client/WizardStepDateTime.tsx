import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

interface WizardStepDateTimeProps {
  stylistId: string;
  serviceId: string;
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

export const WizardStepDateTime: React.FC<WizardStepDateTimeProps> = ({
  stylistId,
  serviceId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fecha de hoy en formato Bolivia YYYY-MM-DD
  const getTodayStr = () => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(now);
    } catch (e) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - offset * 60 * 1000);
      return localToday.toISOString().split('T')[0];
    }
  };

  const minDate = getTodayStr();

  useEffect(() => {
    if (!selectedDate || !stylistId || !serviceId) return;

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/client/availability', {
          params: {
            stylistId,
            serviceId,
            date: selectedDate,
          },
        });
        setSlots(res.data);
      } catch (err: any) {
        console.error('Error al obtener turnos:', err);
        setError('No se pudo cargar la disponibilidad. Intente otra fecha o barbero.');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, stylistId, serviceId]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white">Elige Fecha y Hora</h3>
        <p className="text-xs text-zinc-500 mt-1">Busca los días y horarios que mejor se adapten a tu agenda.</p>
      </div>

      <div className="max-w-xs mx-auto">
        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-medium flex items-center gap-1.5 justify-center">
          <Calendar size={14} /> Seleccionar Fecha
        </label>
        <div className="relative">
          <input
            ref={dateInputRef}
            type="date"
            min={minDate}
            value={selectedDate}
            onChange={(e) => {
              onSelectDate(e.target.value);
              onSelectTime(''); // Limpiar hora al cambiar fecha
            }}
            className="w-full bg-zinc-900 border border-zinc-800 pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 text-center uppercase rounded-none"
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

      {loading ? (
        <div className="text-center py-8 text-sm uppercase tracking-widest text-zinc-500">Consultando disponibilidad...</div>
      ) : error ? (
        <div className="p-4 bg-zinc-950 border border-zinc-900 text-zinc-400 text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertTriangle size={16} className="text-zinc-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : selectedDate ? (
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-zinc-400 text-center flex items-center justify-center gap-1.5 font-medium">
            <Clock size={14} /> Horarios Disponibles para el {selectedDate}
          </h4>

          {slots.length === 0 ? (
            <p className="text-center text-xs text-zinc-600 py-6">
              No hay horarios disponibles para este estilista en la fecha seleccionada. Por favor, elige otro día u otro profesional.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-2xl mx-auto">
              {slots.map((slot) => {
                const isSelected = slot === selectedTime;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectTime(slot)}
                    className={`py-2 px-1 text-center font-mono text-xs border tracking-wider transition-all duration-200 ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
