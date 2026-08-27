import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthModal } from '../../components/auth/AuthModal';
import { WizardStepService } from '../../components/client/WizardStepService';
import { WizardStepStylist } from '../../components/client/WizardStepStylist';
import { WizardStepDateTime } from '../../components/client/WizardStepDateTime';
import { BookingSummary } from '../../components/client/BookingSummary';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';
import { ChevronRight, Scissors, ArrowLeft, CheckCircle2, CalendarDays } from 'lucide-react';

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

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  
  // Modales y Auth
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Estado del Wizard
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setStep(3);
  };

  const handleConfirmBooking = async (clientName: string, clientPhone: string, notes: string) => {
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) return;

    try {
      const res = await api.post('/client/appointments', {
        serviceId: selectedService.id,
        stylistId: selectedStylist.id,
        date: selectedDate,
        time: selectedTime,
        clientName,
        clientPhone,
        notes,
      });

      setBookingSuccess(res.data);
      if (user) {
        await refreshProfile();
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al guardar la reserva');
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedStylist(null);
    setSelectedDate('');
    setSelectedTime('');
    setBookingSuccess(null);
  };

  // Pantalla de Éxito
  if (bookingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="text-center space-y-6 p-8 border-zinc-200 shadow-xl">
          <div className="text-white flex justify-center">
            <CheckCircle2 size={48} className="animate-bounce text-zinc-200" />
          </div>
          <div>
            <h2 className="text-base font-bold uppercase tracking-widest text-white">¡Reserva Confirmada!</h2>
            <p className="text-xs text-zinc-400 mt-2">Tu cita se ha registrado correctamente en nuestro sistema.</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 text-xs text-left space-y-2.5">
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-semibold">Servicio:</span>
              <span className="font-bold text-white uppercase tracking-wider">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-semibold">Barbero:</span>
              <span className="font-bold text-white uppercase tracking-wider">{selectedStylist?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-semibold">Fecha y Hora:</span>
              <span className="font-bold text-white uppercase tracking-wider">{selectedDate} - {selectedTime}</span>
            </div>
            {bookingSuccess.isFifthCutPromo && (
              <div className="border-t border-zinc-800 pt-2.5 mt-2.5 text-center text-white font-bold uppercase text-[10px] tracking-widest flex justify-center items-center gap-1">
                🎁 ¡Esta cita aplica la promo de 5to corte gratis!
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleReset} variant="primary" fullWidth>
              Agendar otro turno
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" fullWidth>
              Volver al inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Wizard Header Progress */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer relative z-30"
          >
            <ArrowLeft size={14} /> Volver
          </button>
        ) : (
          <div className="w-16 h-4" />
        )}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
          <span className={step >= 1 ? 'text-white' : ''}>Servicio</span>
          <ChevronRight size={10} className="text-zinc-700" />
          <span className={step >= 2 ? 'text-white' : ''}>Barbero</span>
          <ChevronRight size={10} className="text-zinc-700" />
          <span className={step >= 3 ? 'text-white' : ''}>Fecha & Hora</span>
          <ChevronRight size={10} className="text-zinc-700" />
          <span className={step >= 4 ? 'text-white' : ''}>Confirmación</span>
        </div>
      </div>

      {/* Render Steps */}
      <div className="bg-zinc-950 border border-zinc-900 p-6 sm:p-8 min-h-[400px]">
        {step === 1 && (
          <WizardStepService
            selectedServiceId={selectedService?.id || ''}
            onSelect={handleServiceSelect}
            completedCuts={user ? user.completedCuts : 0}
          />
        )}
        {step === 2 && (
          <WizardStepStylist
            selectedStylistId={selectedStylist?.id || ''}
            onSelect={handleStylistSelect}
          />
        )}
        {step === 3 && selectedStylist && selectedService && (
          <WizardStepDateTime
            stylistId={selectedStylist.id}
            serviceId={selectedService.id}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
          />
        )}
        {step === 3 && selectedTime && (
          <div className="text-center pt-6">
            <Button onClick={() => setStep(4)} variant="primary" className="text-xs uppercase tracking-widest">
              Continuar al Resumen
            </Button>
          </div>
        )}
        {step === 4 && selectedService && selectedStylist && (
          <BookingSummary
            service={selectedService}
            stylist={selectedStylist}
            date={selectedDate}
            time={selectedTime}
            completedCuts={user ? user.completedCuts : 0}
            onConfirm={handleConfirmBooking}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
};
