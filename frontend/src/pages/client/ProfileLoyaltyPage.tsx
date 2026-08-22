import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { LoyaltyCard } from '../../components/client/LoyaltyCard';
import { Card } from '../../components/ui/Card';
import { Award, History, Info, Gift } from 'lucide-react';

interface LoyaltyHistoryLog {
  id: string;
  points: number;
  reason: string;
  rewardType: 'FIFTH_HAIRCUT_DISCOUNT' | 'POINTS_REDEMPTION' | null;
  createdAt: string;
}

export const ProfileLoyaltyPage: React.FC = () => {
  const { user } = useAuth();
  const [historyLogs, setHistoryLogs] = useState<LoyaltyHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/client/loyalty/history');
        setHistoryLogs(res.data);
      } catch (err) {
        console.error('Error al obtener historial de fidelización:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <Award className="text-zinc-400" /> Mi Programa de Lealtad
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Consulta tus beneficios, acumulación de cortes y puntos.</p>
      </div>

      {/* Loyalty Card and Explainer row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <LoyaltyCard
            completedCuts={user.completedCuts}
            pointsBalance={user.pointsBalance}
            name={user.name}
          />
        </div>

        <Card className="lg:col-span-3 space-y-4 flex flex-col justify-center">
          <h3 className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5 border-b border-zinc-900 pb-2">
            <Info size={14} className="text-zinc-400" /> ¿Cómo funciona el Club JotaBarber?
          </h3>
          <ul className="space-y-3 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="bg-white text-black font-mono font-bold w-4 h-4 rounded-none flex items-center justify-center text-[10px] mt-0.5">1</span>
              <span>
                <strong>Contador de Cortes:</strong> Por cada corte que reserves (y se marque como COMPLETO en el panel), sumas 1 punto a tu tarjeta. Al completar 4, ¡el 5to es 100% gratis!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-black font-mono font-bold w-4 h-4 rounded-none flex items-center justify-center text-[10px] mt-0.5">2</span>
              <span>
                <strong>Puntos de Lealtad:</strong> Acumulas 1 punto por cada $1 gastado en servicios o compras de productos en caja.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-black font-mono font-bold w-4 h-4 rounded-none flex items-center justify-center text-[10px] mt-0.5">3</span>
              <span>
                <strong>Canje Directo:</strong> Los puntos acumulados se pueden redimir por ceras capilares, aceites y otros productos premium en la sucursal de manera inmediata.
              </span>
            </li>
          </ul>
        </Card>
      </div>

      {/* History table */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
          <History size={14} className="text-zinc-400" /> Historial de Movimientos
        </h3>

        {loading ? (
          <div className="text-center py-8 text-xs uppercase tracking-widest text-zinc-500">Cargando transacciones...</div>
        ) : historyLogs.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 border border-zinc-900">
            <p className="text-xs text-zinc-600 uppercase tracking-wider">Aún no registras movimientos en tu historial</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-900 bg-zinc-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Detalle</th>
                  <th className="p-3 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {historyLogs.map((log) => {
                  const isEarned = log.points > 0;
                  const isUsed = log.points < 0;
                  const logDate = new Date(log.createdAt).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="p-3 text-zinc-500 font-mono">{logDate}</td>
                      <td className="p-3">
                        <span className="font-semibold text-zinc-300 block uppercase tracking-wider">{log.reason}</span>
                        {log.rewardType === 'FIFTH_HAIRCUT_DISCOUNT' && (
                          <span className="text-[9px] bg-zinc-900 text-zinc-400 px-1 border border-zinc-800 font-bold uppercase tracking-wider inline-block mt-1">
                            🎁 Regalo de Fidelidad
                          </span>
                        )}
                        {log.rewardType === 'POINTS_REDEMPTION' && (
                          <span className="text-[9px] bg-zinc-900 text-zinc-400 px-1 border border-zinc-800 font-bold uppercase tracking-wider inline-block mt-1">
                            🛍 Canje Realizado
                          </span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-bold font-mono ${isEarned ? 'text-white' : isUsed ? 'text-zinc-500' : 'text-zinc-600'}`}>
                        {log.points > 0 ? `+${log.points}` : log.points}
                      </td>
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
