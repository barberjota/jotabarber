import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Calendar, Clock, User, Scissors, AlignLeft, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: string;
  durationMin: number;
  countsForFidelity: boolean;
}

interface Stylist {
  id: string;
  name: string;
}

interface BookingSummaryProps {
  service: Service;
  stylist: Stylist;
  date: string;
  time: string;
  completedCuts: number;
  onConfirm: (notes: string) => Promise<void>;
  onBack: () => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  service,
  stylist,
  date,
  time,
  completedCuts,
  onConfirm,
  onBack,
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = Number(service.price);
  const isPromoApplied = completedCuts === 4 && service.countsForFidelity;
  const discount = isPromoApplied ? price : 0;
  const total = price - discount;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(notes);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la reserva. Por favor intente de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white">Resumen de tu Reserva</h3>
        <p className="text-xs text-zinc-500 mt-1">Revisa los detalles antes de confirmar tu cita.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900 text-red-400 text-xs">
          {error}
        </div>
      )}

      <Card className="space-y-4">
        {/* Detalle Servicio */}
        <div className="flex items-start gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 mt-0.5">
            <Scissors size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-medium">Servicio</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">{service.name}</span>
            <span className="text-xs text-zinc-400 block mt-0.5">Duración: {service.durationMin} minutos</span>
          </div>
        </div>

        {/* Detalle Estilista */}
        <div className="flex items-start gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 mt-0.5">
            <User size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-medium">Estilista / Barbero</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider">{stylist.name}</span>
          </div>
        </div>

        {/* Detalle Fecha y Hora */}
        <div className="flex items-start gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 mt-0.5">
            <Calendar size={16} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-medium">Fecha y Hora</span>
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
              {date} <Clock size={12} className="text-zinc-500" /> {time}
            </span>
          </div>
        </div>

        {/* Campo de notas (opcional) */}
        <div className="border-t border-zinc-900 pt-4">
          <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-medium flex items-center gap-1.5">
            <AlignLeft size={14} /> Notas / Indicaciones Especiales <span className="text-[10px] text-zinc-600">(Opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 p-3 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none h-20 resize-none"
            placeholder="Ej: Prefiero corte bajo con navaja, etc."
          ></textarea>
        </div>

        {/* Desglose de Pago */}
        <div className="border-t border-zinc-900 pt-4 space-y-2">
          <div className="flex justify-between text-xs uppercase tracking-wider text-zinc-400">
            <span>Precio del Servicio</span>
            <span>Bs. {price.toFixed(2)}</span>
          </div>

          {isPromoApplied && (
            <div className="flex justify-between text-xs uppercase tracking-wider text-white font-semibold flex-wrap items-center gap-1">
              <span className="flex items-center gap-1 text-white">
                <Sparkles size={12} className="animate-pulse" /> Descuento 5to Corte (100%)
              </span>
              <span className="text-white">-Bs. {price.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm uppercase tracking-widest border-t border-zinc-900 pt-2 font-bold text-white">
            <span>Total a Pagar</span>
            <span>Bs. {total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          fullWidth
        >
          Atrás
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          disabled={submitting}
          fullWidth
        >
          {submitting ? 'Confirmando...' : 'Confirmar Reserva'}
        </Button>
      </div>
    </div>
  );
};
