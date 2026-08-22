import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Award, Calendar, Scissors, LogOut, User as UserIcon } from 'lucide-react';

export const ClientLayout: React.FC = () => {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!token || (user && user.role !== 'CLIENT'))) {
      navigate('/');
    }
  }, [user, token, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen bg-darkBg flex items-center justify-center text-xs uppercase tracking-widest text-zinc-500">Cargando perfil...</div>;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-darkBg text-zinc-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-black/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/branding/logo.png" alt="JotaBarber Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-[9px] bg-white text-black px-1 py-0.5 uppercase tracking-wider font-bold">Inicio</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline">Hola, {user.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-xs uppercase tracking-widest text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <LogOut size={14} /> Salir
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Side Menu */}
          <aside className="md:col-span-1">
            <nav className="flex flex-col space-y-1 bg-zinc-950 border border-zinc-900 p-4">
              <Link
                to="/mi-cuenta"
                className={`flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-widest border transition-all ${
                  isActive('/mi-cuenta')
                    ? 'bg-white text-black border-white font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Award size={14} /> Mi Lealtad
              </Link>
              <Link
                to="/mi-cuenta/citas"
                className={`flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-widest border transition-all ${
                  isActive('/mi-cuenta/citas')
                    ? 'bg-white text-black border-white font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Calendar size={14} /> Mis Reservas
              </Link>
              <Link
                to="/reservar"
                className={`flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-widest border transition-all ${
                  isActive('/reservar')
                    ? 'bg-white text-black border-white font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Scissors size={14} /> Agendar Cita
              </Link>
            </nav>
          </aside>

          {/* Content Area */}
          <section className="md:col-span-3">
            <Outlet />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/40 py-6 text-center text-[10px] text-zinc-700 uppercase tracking-widest">
        JotaBarber Fidelidad Portal © {new Date().getFullYear()}
      </footer>
    </div>
  );
};
