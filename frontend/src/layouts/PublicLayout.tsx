import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { LayoutDashboard, LogOut, ShoppingBag, X, Trash2, Plus, Minus, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';

export const PublicLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Por favor, ingresa tu nombre y número de teléfono.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const res = await api.post('/client/orders', {
        clientName,
        clientPhone,
        items,
      });

      setOrderSuccess(res.data);
      clearCart();
      setClientName('');
      setClientPhone('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-darkBg text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img src="/branding/logo.png" alt="JotaBarber Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/reservar"
              className="text-xs uppercase tracking-widest bg-white text-black px-3.5 py-2 font-semibold hover:bg-zinc-200 transition-colors"
            >
              Reservar Cita
            </Link>

            {/* Botón Carrito */}
            <button
              onClick={() => {
                setOrderSuccess(null);
                setError(null);
                setIsCartOpen(true);
              }}
              className="relative p-2 text-zinc-400 hover:text-white transition-colors"
              title="Abrir Carrito"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-white text-black font-mono font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>

            {user && (
              <div className="flex items-center gap-3">
                <Link
                  to="/admin/dashboard"
                  className="text-xs uppercase tracking-widest text-zinc-300 hover:text-white flex items-center gap-1"
                >
                  <LayoutDashboard size={14} /> Panel Admin
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-xs uppercase tracking-widest text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <LogOut size={14} /> Salir
                </button>
              </div>
            )}

            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/40 py-8 text-center text-xs text-zinc-600 uppercase tracking-widest">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex justify-center">
            <a
              href="https://www.tiktok.com/@jota.barber1?_r=1&_t=ZS-98h7uTCDxau"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition-colors text-[9px] tracking-widest font-semibold uppercase"
            >
              TikTok Oficial
            </a>
          </div>
          <p>© {new Date().getFullYear()} JotaBarber. Todos los derechos reservados.</p>
          <p className="text-[10px] text-zinc-700">Minimalist & Dark Luxe Design</p>
        </div>
      </footer>

      {/* Drawer del Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div
            className="w-full max-w-md bg-zinc-950 border-l border-zinc-900 h-full flex flex-col justify-between p-6 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-zinc-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Tu Pedido</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto py-6 space-y-6">
              {orderSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="flex justify-center text-white">
                    <CheckCircle2 size={48} className="text-zinc-200" />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white">¡Pedido Reservado!</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Hemos apartado tus productos. Estarán listos para ti cuando pases por la peluquería.
                  </p>
                  <Button onClick={() => { setIsCartOpen(false); setOrderSuccess(null); }} variant="outline" className="text-xs uppercase tracking-widest">
                    Cerrar
                  </Button>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-xs uppercase tracking-widest space-y-2">
                  <ShoppingBag size={32} className="mx-auto text-zinc-700 mb-2" />
                  <span>Tu carrito está vacío</span>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-900 text-red-400 text-[11px]">
                      {error}
                    </div>
                  )}

                  {/* Listado de items */}
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="flex gap-3 justify-between items-center border-b border-zinc-900/60 pb-3">
                        <div className="flex gap-3 items-center">
                          <img
                            src={item.product.imageUrl || 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=100&h=100&fit=crop'}
                            alt={item.product.name}
                            className="w-10 h-10 object-cover border border-zinc-800 filter grayscale"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">{item.product.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Bs. {Number(item.product.price).toFixed(2)} c/u</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Cantidades */}
                          <div className="flex items-center border border-zinc-800 bg-zinc-900">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 text-zinc-400 hover:text-white"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="px-2 text-xs font-bold font-mono text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="px-2 py-1 text-zinc-400 hover:text-white disabled:opacity-30"
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          <button onClick={() => removeFromCart(item.product.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulario de Checkout */}
                  <form onSubmit={handleCheckout} className="border-t border-zinc-900 pt-6 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Tus Datos para Apartar</span>
                    
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Juan Pérez"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Teléfono (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej: 63938875"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none font-mono"
                      />
                    </div>

                    <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-xs">
                      <span className="uppercase tracking-wider text-zinc-400">Total Reservado:</span>
                      <span className="font-mono text-white font-bold text-sm">Bs. {totalAmount.toFixed(2)}</span>
                    </div>

                    <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                      {submitting ? 'Reservando Pedido...' : 'Confirmar Pedido'}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
