import React, { useEffect } from 'react';
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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black border-r border-zinc-900 flex flex-col justify-between p-6 flex-shrink-0">
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

      {/* Main Panel Content Area */}
      <section className="flex-grow p-6 md:p-8 overflow-y-auto max-h-screen">
        <Outlet />
      </section>
    </div>
  );
};
