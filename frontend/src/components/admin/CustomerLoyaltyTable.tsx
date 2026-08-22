import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Search, Award, RefreshCw, Plus, Minus } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  pointsBalance: number;
  completedCuts: number;
  createdAt: string;
  _count: {
    appointments: number;
  };
}

export const CustomerLoyaltyTable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal de ajuste
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [pointsAdjustment, setPointsAdjustment] = useState<number>(0);
  const [cutsAdjustment, setCutsAdjustment] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error al obtener clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdjust = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPointsAdjustment(0);
    setCutsAdjustment(0);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setAdjusting(true);
    try {
      await api.post('/admin/loyalty/adjust', {
        userId: selectedCustomer.id,
        pointsAdjustment,
        cutsAdjustment,
        reason: adjustReason || 'Ajuste administrativo manual',
      });
      setIsAdjustModalOpen(false);
      fetchCustomers(); // Refrescar tabla
      alert('Fidelización ajustada correctamente');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al ajustar fidelización');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Buscar por nombre o celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
        </div>
        <Button onClick={fetchCustomers} variant="outline" size="sm" className="flex items-center gap-1">
          <RefreshCw size={14} /> Actualizar Lista
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando clientes...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-400">
                <th className="p-3">Nombre</th>
                <th className="p-3">Contacto</th>
                <th className="p-3 text-center">Cortes Completados</th>
                <th className="p-3 text-center">Puntos Acumulados</th>
                <th className="p-3 text-center">Citas Totales</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-white uppercase tracking-wider block">{c.name}</span>
                    <span className="text-[10px] text-zinc-500">{c.email}</span>
                  </td>
                  <td className="p-3 font-mono text-zinc-400">{c.phone}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold text-white text-sm">{c.completedCuts}</span>
                      <span className="text-zinc-600">/ 5</span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-white font-mono">{c.pointsBalance} PTS</td>
                  <td className="p-3 text-center font-mono text-zinc-400">{c._count.appointments}</td>
                  <td className="p-3 text-right">
                    <Button onClick={() => handleOpenAdjust(c)} variant="outline" size="sm" className="flex items-center gap-1 ml-auto">
                      <Award size={14} /> Ajustar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Ajuste de Fidelización */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Ajuste Manual: ${selectedCustomer?.name}`}
        size="sm"
      >
        {selectedCustomer && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="bg-zinc-900 p-3 border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wider">
                <span className="text-zinc-400">Puntos actuales:</span>
                <span className="font-bold text-white font-mono">{selectedCustomer.pointsBalance} PTS</span>
              </div>
              <div className="flex justify-between text-xs uppercase tracking-wider">
                <span className="text-zinc-400">Cortes actuales:</span>
                <span className="font-bold text-white">{selectedCustomer.completedCuts} / 5</span>
              </div>
            </div>

            {/* Ajuste de Puntos */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-medium">Ajuste de Puntos</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPointsAdjustment((prev) => prev - 10)}
                  className="bg-zinc-900 border border-zinc-800 p-2 text-white hover:bg-zinc-800"
                >
                  -10
                </button>
                <input
                  type="number"
                  value={pointsAdjustment}
                  onChange={(e) => setPointsAdjustment(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono text-center focus:outline-none focus:border-zinc-500 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setPointsAdjustment((prev) => prev + 10)}
                  className="bg-zinc-900 border border-zinc-800 p-2 text-white hover:bg-zinc-800"
                >
                  +10
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">Suma o resta saldo de puntos acumulados.</span>
            </div>

            {/* Ajuste de Cortes */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-medium">Ajuste de Cortes</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCutsAdjustment((prev) => prev - 1)}
                  className="bg-zinc-900 border border-zinc-800 p-2 text-white hover:bg-zinc-800"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="-4"
                  max="4"
                  value={cutsAdjustment}
                  onChange={(e) => setCutsAdjustment(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white font-mono text-center focus:outline-none focus:border-zinc-500 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setCutsAdjustment((prev) => prev + 1)}
                  className="bg-zinc-900 border border-zinc-800 p-2 text-white hover:bg-zinc-800"
                >
                  +1
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">Ajusta el contador de cortes del ciclo de 5 cortes.</span>
            </div>

            {/* Razón */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1 font-medium">Razón del Ajuste</label>
              <input
                type="text"
                required
                placeholder="Ej: Compensación por demora en cita"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={adjusting}>
              {adjusting ? 'Aplicando ajuste...' : 'Confirmar Ajuste'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};
