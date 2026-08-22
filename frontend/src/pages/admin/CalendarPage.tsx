import React from 'react';
import { CalendarView } from '../../components/admin/CalendarView';
import { CalendarDays } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <CalendarDays className="text-zinc-400" /> Agenda de Citas
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Administra el calendario de turnos y cambia el estado de reservas.</p>
      </div>

      <CalendarView />
    </div>
  );
};
