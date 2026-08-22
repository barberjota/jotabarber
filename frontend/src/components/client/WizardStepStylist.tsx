import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Check, User } from 'lucide-react';

interface Stylist {
  id: string;
  name: string;
  photoUrl: string | null;
}

interface WizardStepStylistProps {
  selectedStylistId: string;
  onSelect: (stylist: Stylist) => void;
}

export const WizardStepStylist: React.FC<WizardStepStylistProps> = ({
  selectedStylistId,
  onSelect,
}) => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const res = await api.get('/client/stylists');
        setStylists(res.data);
      } catch (error) {
        console.error('Error al obtener estilistas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStylists();
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-sm uppercase tracking-widest text-zinc-500">Cargando estilistas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white">Selecciona tu Barbero</h3>
        <p className="text-xs text-zinc-500 mt-1">Elige al profesional que te atenderá en tu sesión.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stylists.map((stylist) => {
          const isSelected = stylist.id === selectedStylistId;

          return (
            <Card
              key={stylist.id}
              onClick={() => onSelect(stylist)}
              className={`relative border flex flex-col items-center p-6 text-center cursor-pointer transition-all ${
                isSelected ? 'border-white bg-zinc-900' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
              }`}
            >
              <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden mb-4 rounded-none">
                {stylist.photoUrl ? (
                  <img
                    src={stylist.photoUrl}
                    alt={stylist.name}
                    className="w-full h-full object-cover filter grayscale"
                  />
                ) : (
                  <User size={32} className="text-zinc-600" />
                )}
              </div>

              <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-1">{stylist.name}</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Barbero Oficial</p>

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
