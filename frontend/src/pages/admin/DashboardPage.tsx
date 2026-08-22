import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { DollarSign, Scissors, UserCheck, Users, Gift, TrendingUp } from 'lucide-react';

interface MetricData {
  revenue: number;
  completedServices: number;
  pendingServices: number;
  totalClients: number;
  pointsRedeemed: number;
  stylistMetrics: {
    name: string;
    completedCount: number;
  }[];
  topClients: {
    name: string;
    points: number;
    completedCuts: number;
    totalVisits: number;
  }[];
  recentSales: {
    id: string;
    clientName: string;
    total: number;
    date: string;
  }[];
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        setMetrics(res.data);
      } catch (err) {
        console.error('Error al obtener métricas del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm uppercase tracking-widest text-zinc-500">Cargando métricas generales...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-12 text-xs text-zinc-500 uppercase tracking-widest">Error al cargar datos</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <TrendingUp className="text-zinc-400" /> Dashboard de Control
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Monitoreo general de ventas, citas y programa de fidelidad.</p>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Revenue */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Ingresos Totales</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">${metrics.revenue.toFixed(2)}</span>
          </div>
          <div className="bg-white text-black p-2"><DollarSign size={16} /></div>
        </Card>

        {/* Completed Services */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Cortes Realizados</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">{metrics.completedServices}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-2"><Scissors size={16} /></div>
        </Card>

        {/* Pending Services */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Citas Pendientes</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">{metrics.pendingServices}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-2"><UserCheck size={16} /></div>
        </Card>

        {/* Total Clients */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Clientes Club</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">{metrics.totalClients}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-2"><Users size={16} /></div>
        </Card>

        {/* Points Redeemed */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Canje de Regalos</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">{metrics.pointsRedeemed} PTS</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-2"><Gift size={16} /></div>
        </Card>
      </div>

      {/* Row 2: Barberos y Clientes más Fieles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento por Estilista */}
        <Card className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white font-bold border-b border-zinc-900 pb-2">Servicios Completados por Barbero</h3>
          {metrics.stylistMetrics.length === 0 ? (
            <p className="text-xs text-zinc-600 uppercase tracking-widest text-center py-10">Sin datos de estilistas</p>
          ) : (
            <div className="space-y-3 pt-2">
              {metrics.stylistMetrics.map((st) => (
                <div key={st.name} className="flex justify-between items-center text-xs uppercase tracking-wider">
                  <span className="text-zinc-400 font-medium">{st.name}</span>
                  <span className="font-bold text-white font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5">{st.completedCount} Servicios</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Clientes Destacados */}
        <Card className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white font-bold border-b border-zinc-900 pb-2">Top Clientes con más Puntos</h3>
          {metrics.topClients.length === 0 ? (
            <p className="text-xs text-zinc-600 uppercase tracking-widest text-center py-10">Sin datos de clientes</p>
          ) : (
            <div className="space-y-3 pt-2">
              {metrics.topClients.map((cl) => (
                <div key={cl.name} className="flex justify-between items-center text-xs uppercase tracking-wider">
                  <div>
                    <span className="text-white font-semibold block">{cl.name}</span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Visitas completas: {cl.totalVisits} | Cortes ciclo: {cl.completedCuts}/5</span>
                  </div>
                  <span className="font-bold text-white font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-0.5">{cl.points} PTS</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Ventas Recientes */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-white font-bold">Ventas Recientes de Caja / POS</h3>
        {metrics.recentSales.length === 0 ? (
          <div className="text-center py-10 bg-zinc-950 border border-zinc-900">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-900 bg-zinc-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  <th className="p-3">ID Venta</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-right">Total Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {metrics.recentSales.map((s) => {
                  const sDate = new Date(s.date).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={s.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="p-3 text-zinc-500 font-mono">{s.id.substring(0, 8)}...</td>
                      <td className="p-3 font-semibold text-zinc-300 uppercase tracking-wider">{s.clientName}</td>
                      <td className="p-3 font-mono text-zinc-500">{sDate}</td>
                      <td className="p-3 text-right font-bold text-white font-mono">${s.total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
