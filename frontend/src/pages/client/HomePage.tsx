import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Scissors, ShieldCheck, Gift, Star, Clock } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationMin: number;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrusel de imágenes
  const slides = ['/slide1.webp', '/slide2.webp', '/slide3.webp'];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/client/services');
        setServices(res.data.slice(0, 3)); // Solo mostramos los 3 primeros en la landing
      } catch (err) {
        console.error('Error al obtener servicios públicos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section con Carrusel */}
      <section className="relative bg-black text-white h-[80vh] flex items-center justify-center border-b border-zinc-900 overflow-hidden">
        {/* Imágenes del carrusel */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, index) => (
            <div
              key={slide}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>

        {/* Indicadores de diapositivas (Dots) */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-4' : 'bg-white/40'
              }`}
              title={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6 py-10 sm:px-12 sm:py-16 max-w-2xl mx-auto bg-black/75 backdrop-blur-sm border border-zinc-800 space-y-6">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-zinc-400 font-bold block">Estilo • Tradición • Precisión</span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
            JotaBarber
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            Una experiencia de barbería de lujo en blanco y negro. Cuidado de cabello y barba de primer nivel con un programa de fidelidad pensado para ti.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => navigate('/reservar')}
              variant="primary"
              size="lg"
              className="text-xs uppercase tracking-widest font-bold"
            >
              Agendar Turno Online
            </Button>
            <Button
              onClick={() => {
                const loyaltySection = document.getElementById('club-loyalty');
                if (loyaltySection) loyaltySection.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              size="lg"
              className="text-xs uppercase tracking-widest"
            >
              Conocer Club de Puntos
            </Button>
          </div>
        </div>
      </section>

      {/* Programa de Fidelidad Explainer */}
      <section id="club-loyalty" className="max-w-5xl mx-auto px-4 space-y-12 scroll-mt-20">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">Beneficios Exclusivos</span>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-white">Club de Fidelidad Jotabarber</h2>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">Recompensamos tu preferencia con servicios gratuitos y puntos acumulables.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="flex flex-col justify-between p-6 space-y-4">
            <div className="space-y-2">
              <div className="bg-white text-black w-8 h-8 flex items-center justify-center font-bold">5</div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-white">Regla del 5to Corte Gratis</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cada cita que completes de servicios elegibles suma 1 punto a tu contador. Al completar tu 4to corte, ¡el 5to es completamente gratis! El descuento se aplica de manera automática en el wizard de reserva.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col justify-between p-6 space-y-4">
            <div className="space-y-2">
              <div className="bg-zinc-900 border border-zinc-800 text-white w-8 h-8 flex items-center justify-center font-bold">
                <Gift size={16} />
              </div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-white">Acumulación de Puntos</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Por cada $1 gastado en cualquier servicio o en la compra de productos para el cuidado de tu cabello y barba, recibes 1 punto de fidelidad directamente en tu cuenta para canjes futuros.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col justify-between p-6 space-y-4">
            <div className="space-y-2">
              <div className="bg-zinc-900 border border-zinc-800 text-white w-8 h-8 flex items-center justify-center font-bold">
                <Star size={16} />
              </div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-white">Canje por Productos</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Accede a nuestro catálogo premium de productos (ceras modeladoras mate, aceites hidratantes, lociones para barba) y canjéalos directamente con tus puntos acumulados sin costo adicional.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Servicios Destacados */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">Nuestros Precios</span>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-white">Servicios de Barbería</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500">Cargando catálogo de servicios...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col justify-between p-5 space-y-6">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white uppercase text-xs tracking-wider">{service.name}</h3>
                    <span className="font-mono text-white text-xs font-bold">${Number(service.price).toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{service.description || 'Experiencia premium garantizada.'}</p>
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-500 border-t border-zinc-900 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {service.durationMin} MIN
                  </span>
                  <span>Corte Fiel ✔</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <Button
            onClick={() => navigate('/reservar')}
            variant="outline"
            className="text-xs uppercase tracking-widest font-bold"
          >
            Ver todos los servicios y reservar
          </Button>
        </div>
      </section>
    </div>
  );
};
