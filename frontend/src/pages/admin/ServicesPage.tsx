import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Edit2, Trash2, Plus, RefreshCw, Scissors, Clock } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string;
  countsForFidelity: boolean;
  isActive: boolean;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState('30');
  const [price, setPrice] = useState('');
  const [countsForFidelity, setCountsForFidelity] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/client/services?all=true');
      setServices(res.data);
    } catch (err) {
      console.error('Error al obtener servicios de administración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [refreshTrigger]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDurationMin('30');
    setPrice('');
    setCountsForFidelity(true);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setDescription(s.description || '');
    setDurationMin(s.durationMin.toString());
    setPrice(Number(s.price).toString());
    setCountsForFidelity(s.countsForFidelity);
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      name,
      description,
      durationMin: Number(durationMin),
      price: Number(price),
      countsForFidelity,
      isActive,
    };

    try {
      if (editingService) {
        await api.put(`/admin/services/${editingService.id}`, data);
        alert('Servicio actualizado con éxito');
      } else {
        await api.post('/admin/services', data);
        alert('Servicio creado con éxito');
      }
      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar/desactivar este servicio?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar servicio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Scissors className="text-zinc-400" /> Tarifas & Servicios
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Configura el catálogo de servicios de corte y barbería.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={fetchServices} variant="outline" size="sm">
            <RefreshCw size={14} />
          </Button>
          <Button onClick={handleOpenAdd} variant="primary" size="sm" className="flex items-center gap-1">
            <Plus size={14} /> Nuevo Servicio
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando servicios...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">No hay servicios configurados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <Card
              key={s.id}
              className={`border relative flex flex-col justify-between ${
                s.isActive ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-900 bg-black opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white uppercase text-sm tracking-wider flex items-center gap-1.5">
                      {s.name}
                      {!s.isActive && (
                        <span className="text-[8px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-1 font-bold">Inactivo</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1 h-10 overflow-hidden line-clamp-2">{s.description || 'Sin descripción'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-white text-base font-bold">${Number(s.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-900 pt-3 mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {s.durationMin} MIN
                </span>
                <span>
                  {s.countsForFidelity ? 'Suma Cortes ✔' : 'No suma cortes ✖'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(s)} className="text-zinc-400 hover:text-white p-1" title="Editar">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-zinc-400 hover:text-red-400 p-1" title="Eliminar">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Crear/Editar Servicio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Nombre del Servicio</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none uppercase tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none h-20 resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Duración (Minutos)</label>
              <input
                type="number"
                required
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
          </div>

          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="countsForFidelityCheck"
                checked={countsForFidelity}
                onChange={(e) => setCountsForFidelity(e.target.checked)}
                className="accent-white h-4 w-4"
              />
              <label htmlFor="countsForFidelityCheck" className="text-xs uppercase tracking-widest text-zinc-300 cursor-pointer font-medium">
                Elegible para Tarjeta de Fidelidad (Suma cortes)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveServiceCheck"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-white h-4 w-4"
              />
              <label htmlFor="isActiveServiceCheck" className="text-xs uppercase tracking-widest text-zinc-300 cursor-pointer font-medium">
                Servicio Activo (Visible en reservas)
              </label>
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Guardando...' : editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
