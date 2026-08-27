import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Scissors, ShieldCheck, Gift, Star, Clock, Target, Eye, Package } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: string;
  durationMin: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  stock: number;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
    const fetchData = async () => {
      try {
        const [servicesRes, productsRes] = await Promise.all([
          api.get('/client/services'),
          api.get('/client/products'),
        ]);
        setServices(servicesRes.data.slice(0, 3)); // Primeros 3 servicios
        setProducts(productsRes.data.slice(0, 3)); // Primeros 3 productos
      } catch (err) {
        console.error('Error al obtener datos públicos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
                const mvSection = document.getElementById('mision-vision');
                if (mvSection) mvSection.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              size="lg"
              className="text-xs uppercase tracking-widest"
            >
              Conócenos
            </Button>
          </div>
        </div>
      </section>

      {/* Sección Misión y Visión */}
      <section id="mision-vision" className="max-w-5xl mx-auto px-4 space-y-12 scroll-mt-20">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">Nuestra Esencia</span>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-white">Misión & Visión</h2>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">El compromiso con nuestros clientes define cada detalle de nuestro trabajo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 border-zinc-800 space-y-4 hover:border-zinc-700 transition-all">
            <div className="bg-white text-black w-10 h-10 flex items-center justify-center">
              <Target size={20} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Nuestra Misión</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Proporcionar a nuestros clientes servicios de peluquería y barbería de la más alta calidad, fusionando técnicas tradicionales con el estilo moderno de vanguardia, en un ambiente sofisticado de relajación absoluta para el caballero de hoy.
            </p>
          </Card>

          <Card className="p-8 border-zinc-800 space-y-4 hover:border-zinc-700 transition-all">
            <div className="bg-white text-black w-10 h-10 flex items-center justify-center">
              <Eye size={20} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Nuestra Visión</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ser la barbería de lujo de referencia en la región, reconocida por la excelencia técnica de nuestro personal, la innovación constante en cortes y tratamientos de cuidado personal, y el compromiso inquebrantable de brindar una experiencia memorable y distinguida a cada cliente.
            </p>
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
                    <span className="font-mono text-white text-xs font-bold">Bs. {Number(service.price).toFixed(2)}</span>
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

      {/* Catálogo de Productos */}
      <section className="max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">Cuidado Personal</span>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-white">Nuestros Productos</h2>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">Línea de productos premium para el mantenimiento de tu estilo en casa.</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500">Cargando catálogo de productos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col justify-between p-5 space-y-6">
                <div>
                  <div className="relative aspect-square w-full bg-zinc-900 border border-zinc-800 overflow-hidden mb-4">
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=300&h=300&fit=crop'}
                      alt={product.name}
                      className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white uppercase text-xs tracking-wider">{product.name}</h3>
                    <span className="font-mono text-white text-xs font-bold">Bs. {Number(product.price).toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{product.description || 'Cuidado y acabado profesional.'}</p>
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-zinc-500 border-t border-zinc-900 pt-3">
                  <span className="flex items-center gap-1">
                    <Package size={10} /> Stock: {product.stock} unid.
                  </span>
                  {product.stock > 0 ? (
                    <span className="text-emerald-400 font-semibold">Disponible</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Agotado</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
