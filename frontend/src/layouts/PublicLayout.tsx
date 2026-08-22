import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from '../components/auth/AuthModal';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Scissors, LogIn, User, LayoutDashboard, LogOut } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const openAuth = (view: 'login' | 'register') => {
    setAuthView(view);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    // Redirigir según rol
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u && u.role) {
      if (u.role === 'ADMIN' || u.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/mi-cuenta');
      }
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

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'CLIENT' ? (
                  <Link
                    to="/mi-cuenta"
                    className="text-xs uppercase tracking-widest text-zinc-300 hover:text-white flex items-center gap-1"
                  >
                    <User size={14} /> Mi Cuenta
                  </Link>
                ) : (
                  <Link
                    to="/admin/dashboard"
                    className="text-xs uppercase tracking-widest text-zinc-300 hover:text-white flex items-center gap-1"
                  >
                    <LayoutDashboard size={14} /> Panel Admin
                  </Link>
                )}
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
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAuth('login')}
                  className="text-xs uppercase tracking-widest text-zinc-300 hover:text-white flex items-center gap-1 py-2"
                >
                  <LogIn size={14} /> Entrar
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors py-2 hidden sm:block"
                >
                  Registrarse
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
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} JotaBarber. Todos los derechos reservados.</p>
          <p className="text-[10px] text-zinc-700">Minimalist & Dark Luxe Design</p>
        </div>
      </footer>

      {/* Modal Autenticación */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultView={authView}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
