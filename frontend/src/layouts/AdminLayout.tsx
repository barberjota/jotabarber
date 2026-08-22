import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShoppingBag,
  Scissors,
  UserCheck,
  Package,
  LogOut,
  Sliders,
  MoreHorizontal,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!token || (user && user.role !== 'ADMIN' && user.role !== 'STAFF'))) {
      navigate('/');
    }
  }, [user, token, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen bg-darkBg flex items-center justify-center text-xs uppercase tracking-widest text-zinc-500">Cargando panel...</div>;
  }

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-darkBg text-zinc-100 flex flex-col md:flex-row">
      {/* Cabecera Superior para Móvil */}
      <header className="md:hidden h-16 bg-black border-b border-zinc-900 flex items-center justify-between px-6 z-40 sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <img src="/branding/logo.png" alt="JotaBarber Logo" className="h-8 w-auto object-contain" />
          <span className="text-[9px] bg-white text-black px-1.5 py-0.5 uppercase tracking-wider font-bold">Admin</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="text-zinc-500 hover:text-red-400 p-1 flex items-center justify-center transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Sidebar para Escritorio */}
      <aside className="hidden md:flex w-64 bg-black border-r border-zinc-900 flex-col justify-between p-6 flex-shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/branding/logo.png" alt="JotaBarber Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-[9px] bg-white text-black px-1 py-0.5 uppercase tracking-wider font-bold">Admin</span>
          </Link>

          {/* User Info Bar */}
          <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 p-3">
            <div className="w-8 h-8 rounded-none bg-white text-black font-mono font-bold flex items-center justify-center text-xs">
              {user.role}
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider line-clamp-1">{user.name}</h4>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Sesión Activa</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1.5 block">Operaciones</span>
            
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                isActive('/admin/dashboard')
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
              }`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </Link>

            <Link
              to="/admin/agenda"
              className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                isActive('/admin/agenda')
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Calendar size={14} /> Agenda
            </Link>

            <Link
              to="/admin/clientes"
              className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                isActive('/admin/clientes')
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Users size={14} /> Clientes & Fidelidad
            </Link>

            <Link
              to="/admin/ventas"
              className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                isActive('/admin/ventas')
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
              }`}
            >
              <ShoppingBag size={14} /> POS & Caja
            </Link>

            {/* Admin Only Config Section */}
            {isAdmin && (
              <>
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-4 mb-1.5 block">Configuración CRUD</span>

                <Link
                  to="/admin/servicios"
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                    isActive('/admin/servicios')
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Scissors size={14} /> Servicios
                </Link>

                <Link
                  to="/admin/estilistas"
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                    isActive('/admin/estilistas')
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <UserCheck size={14} /> Personal (Barberos)
                </Link>

                <Link
                  to="/admin/productos"
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-all ${
                    isActive('/admin/productos')
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Package size={14} /> Productos (Stock)
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="border-t border-zinc-900 pt-4 mt-6 md:mt-0 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest font-semibold text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Barra de Navegación Inferior para Móvil (4 Botones Importantes) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-900 flex items-center justify-around py-2 z-50">
        <Link
          to="/admin/dashboard"
          className={`flex flex-col items-center gap-0.5 text-[9px] uppercase tracking-wider font-semibold py-1 w-1/4 ${
            isActive('/admin/dashboard') ? 'text-white' : 'text-zinc-500'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/admin/agenda"
          className={`flex flex-col items-center gap-0.5 text-[9px] uppercase tracking-wider font-semibold py-1 w-1/4 ${
            isActive('/admin/agenda') ? 'text-white' : 'text-zinc-500'
          }`}
        >
          <Calendar size={18} />
          <span>Agenda</span>
        </Link>
        <Link
          to="/admin/ventas"
          className={`flex flex-col items-center gap-0.5 text-[9px] uppercase tracking-wider font-semibold py-1 w-1/4 ${
            isActive('/admin/ventas') ? 'text-white' : 'text-zinc-500'
          }`}
        >
          <ShoppingBag size={18} />
          <span>Ventas</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center gap-0.5 text-[9px] uppercase tracking-wider font-semibold py-1 w-1/4 ${
            isMobileMenuOpen ? 'text-white' : 'text-zinc-500'
          }`}
        >
          <MoreHorizontal size={18} />
          <span>Más</span>
        </button>
      </div>

      {/* Menú Móvil "Más" Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="bg-zinc-950 border-t border-zinc-900 p-6 space-y-4 pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Más Opciones</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest"
              >
                Cerrar
              </button>
            </div>
            
            <nav className="flex flex-col gap-2">
              <Link
                to="/admin/clientes"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-semibold border ${
                  isActive('/admin/clientes')
                    ? 'bg-white text-black border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Users size={16} /> Clientes & Fidelidad
              </Link>

              {isAdmin && (
                <>
                  <Link
                    to="/admin/servicios"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-semibold border ${
                      isActive('/admin/servicios')
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <Scissors size={16} /> Servicios
                  </Link>

                  <Link
                    to="/admin/estilistas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-semibold border ${
                      isActive('/admin/estilistas')
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <UserCheck size={16} /> Personal (Barberos)
                  </Link>

                  <Link
                    to="/admin/productos"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-semibold border ${
                      isActive('/admin/productos')
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <Package size={16} /> Productos (Stock)
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main Panel Content Area */}
      <section className="flex-grow p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto max-h-screen">
        <Outlet />
      </section>
    </div>
  );
};
