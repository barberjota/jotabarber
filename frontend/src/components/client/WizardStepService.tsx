import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
  countsForFidelity: boolean;
}

interface WizardStepServiceProps {
  selectedServiceId: string;
  onSelect: (service: Service) => void;
  completedCuts: number;
}

export const WizardStepService: React.FC<WizardStepServiceProps> = ({
  selectedServiceId,
  onSelect,
  completedCuts,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/client/services');
        setServices(res.data);
      } catch (error) {
        console.error('Error al obtener servicios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-sm uppercase tracking-widest text-zinc-500">Cargando servicios...</div>;
  }

  const isPromoEligible = completedCuts === 4;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white">Selecciona el Servicio</h3>
        <p className="text-xs text-zinc-500 mt-1">Elige el corte, barba o tratamiento que desees reservar.</p>
        
        {isPromoEligible && (
          <div className="mt-4 p-3 bg-white text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <Sparkles size={14} className="animate-pulse" /> ¡Felicidades! Tienes 4 cortes completados. Tu próximo corte elegible será GRATIS.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const isSelected = service.id === selectedServiceId;
          const servicePrice = Number(service.price);
          const appliesForPromo = isPromoEligible && service.countsForFidelity;

          return (
            <Card
              key={service.id}
              onClick={() => onSelect(service)}
              className={`relative border flex flex-col justify-between ${
                isSelected ? 'border-white bg-zinc-900' : 'border-zinc-800 bg-zinc-950'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-white uppercase text-sm tracking-wider">{service.name}</h4>
                  <div className="text-right">
                    {appliesForPromo ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs line-through text-zinc-500">${servicePrice.toFixed(2)}</span>
                        <span className="text-sm font-bold text-white uppercase tracking-wider">¡GRATIS!</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-white">${servicePrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 h-8">{service.description || 'Sin descripción disponible.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500">
                <span>Duración: {service.durationMin} min</span>
                <span className="flex items-center gap-1">
                  {service.countsForFidelity ? (
                    <span className="text-zinc-300">Suma fidelidad (Cortes)</span>
                  ) : (
                    <span className="text-zinc-600">No aplica para fidelidad</span>
                  )}
                </span>
              </div>

              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-white text-black p-0.5 border border-black">
                  <Check size={12} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
