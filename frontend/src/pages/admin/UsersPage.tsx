import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  RefreshCw,
  Key,
  Phone,
  Shield,
  UserCheck,
  Search,
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'STAFF' | 'CLIENTE';
  pointsBalance: number;
  completedCuts: number;
  stylistId: string | null;
  stylistName: string | null;
  createdAt: string;
}

interface StylistOption {
  id: string;
  name: string;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserData[]>([]);
  const [stylists, setStylists] = useState<StylistOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('TODOS');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Formulario
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'STAFF' | 'CLIENTE'>('STAFF');
  const [formStylistId, setFormStylistId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err: any) {
      console.error('Error al obtener usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStylists = async () => {
    try {
      const res = await api.get('/client/stylists?all=true');
      setStylists(res.data);
    } catch (err: any) {
      console.error('Error al obtener estilistas:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStylists();
  }, [refreshTrigger]);

  // Resetear a la página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRoleFilter]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormPhone('');
    setFormPassword('');
    setFormRole('STAFF');
    setFormStylistId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserData) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormPhone(u.phone);
    setFormPassword('');
    setFormRole(u.role);
    setFormStylistId(u.stylistId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: any = {
      name: formName,
      phone: formPhone,
      role: formRole,
      stylistId: formRole === 'STAFF' && formStylistId ? formStylistId : null,
    };

    if (formPassword.trim()) {
      payload.password = formPassword;
    }

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
        alert('Usuario actualizado con éxito');
      } else {
        if (!formPassword.trim()) {
          alert('La contraseña es obligatoria para crear un nuevo usuario');
          setSubmitting(false);
          return;
        }
        await api.post('/admin/users', payload);
        alert('Usuario creado con éxito');
      }
      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: UserData) => {
    if (u.id === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta de administrador en sesión');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el usuario "${u.name}" (${u.phone})?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${u.id}`);
      alert('Usuario eliminado correctamente');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    const matchesRole =
      selectedRoleFilter === 'TODOS' ? true : u.role === selectedRoleFilter;
    return matchesQuery && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-white text-black text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest border border-white">
            Administrador
          </span>
        );
      case 'STAFF':
        return (
          <span className="bg-zinc-800 text-zinc-200 text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest border border-zinc-700 flex items-center gap-1 w-fit">
            <UserCheck size={10} /> Peluquero / Barbero
          </span>
        );
      case 'CLIENTE':
      default:
        return (
          <span className="bg-zinc-950 text-zinc-500 text-[9px] font-semibold px-2 py-0.5 uppercase tracking-widest border border-zinc-900">
            Cliente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Users size={20} /> Gestión de Usuarios
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Crea accesos y contraseñas para los barberos/peluqueros y administradores del sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw size={14} />
          </Button>
          <Button onClick={handleOpenAdd} variant="primary" size="sm" className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[10px]">
            <UserPlus size={14} /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros de Rol */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 border border-zinc-900 p-4">
        {/* Búsqueda por texto */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none placeholder-zinc-600"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
          </div>
        </div>

        {/* Roles */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'ADMIN', label: 'Administradores' },
            { id: 'STAFF', label: 'Peluqueros / Barberos' },
            { id: 'CLIENTE', label: 'Clientes' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoleFilter(r.id)}
              className={`px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest border transition-colors cursor-pointer ${
                selectedRoleFilter === r.id
                  ? 'bg-white border-white text-black font-semibold'
                  : 'border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando usuarios...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">No se encontraron usuarios con los filtros aplicados</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-400">
                <th className="p-3">Usuario / Nombre</th>
                <th className="p-3">Teléfono (Login)</th>
                <th className="p-3">Rol en Sistema</th>
                <th className="p-3">Perfil Barbero Vinculado</th>
                <th className="p-3">Fecha Registro</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-3 font-bold text-white uppercase tracking-wider">
                    {u.name}
                  </td>
                  <td className="p-3 font-mono text-zinc-300">
                    {u.phone}
                  </td>
                  <td className="p-3">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="p-3">
                    {u.stylistName ? (
                      <span className="text-zinc-200 font-medium text-[11px]">
                        ✂️ {u.stylistName}
                      </span>
                    ) : u.role === 'STAFF' ? (
                      <span className="text-amber-500 text-[10px] uppercase tracking-wider">Sin vincular</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="text-zinc-400 hover:text-white p-1"
                        title="Editar / Cambiar Contraseña"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-zinc-400 hover:text-red-400 p-1"
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación de 10 en 10 */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-zinc-950 border-t border-zinc-900 p-4">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="text-[10px] uppercase font-bold tracking-wider cursor-pointer"
              >
                Anterior
              </Button>
              <span className="text-[10px] text-zinc-400 font-mono">
                Página {currentPage} de {totalPages} ({filteredUsers.length} usuarios)
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="text-[10px] uppercase font-bold tracking-wider cursor-pointer"
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Editar Usuario: ${editingUser.name}` : 'Crear Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Nombre Completo *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Jota Barbero"
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Número de Teléfono (Usuario de Ingreso) *</label>
            <input
              type="tel"
              required
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="Ej: 70012345"
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Este número será utilizado para iniciar sesión en la plataforma.
            </span>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Rol en el Sistema *</label>
            <select
              required
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none cursor-pointer"
            >
              <option value="STAFF">Peluquero / Barbero (Acceso exclusivo a Agenda)</option>
              <option value="ADMIN">Administrador (Acceso total al sistema)</option>
              <option value="CLIENTE">Cliente (Portal de reservas y fidelidad)</option>
            </select>
          </div>

          {/* Selector de Estilista si el rol es STAFF */}
          {formRole === 'STAFF' && (
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 space-y-2">
              <label className="block text-xs uppercase tracking-widest text-zinc-300 font-semibold">
                Vincular con Perfil de Barbero
              </label>
              <select
                value={formStylistId}
                onChange={(e) => setFormStylistId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none cursor-pointer"
              >
                <option value="">Crear automáticamente perfil de barbero con este nombre</option>
                {stylists.map((st) => (
                  <option key={st.id} value={st.id}>
                    Vincular a: {st.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-400 block leading-tight">
                Al vincularlo, cuando el barbero ingrese con su teléfono y contraseña, la Agenda se filtrará automáticamente mostrando sus citas asignadas.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">
              {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder={editingUser ? 'Dejar en blanco para conservar la actual' : 'Contraseña segura'}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs uppercase tracking-widest"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="text-xs uppercase tracking-widest font-bold"
            >
              {submitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
