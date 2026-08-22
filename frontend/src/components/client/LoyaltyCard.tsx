import React from 'react';
import { Award, Zap } from 'lucide-react';

interface LoyaltyCardProps {
  completedCuts: number; // 0 a 4
  pointsBalance: number;
  name: string;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  completedCuts,
  pointsBalance,
  name,
}) => {
  const totalCutsInCycle = 5;

  return (
    <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-200 p-6 text-white overflow-hidden shadow-2xl flex flex-col justify-between h-56 group">
      {/* Glow effect at corners */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-xl group-hover:bg-white/10 transition-all duration-300"></div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-medium">Tarjeta de Fidelidad</h3>
          <h2 className="text-lg font-bold tracking-tight mt-1 uppercase">{name || 'Cliente Frecuente'}</h2>
        </div>
        <div className="bg-white text-black p-1.5">
          <Award size={18} />
        </div>
      </div>

      {/* Progress Circles (1 to 5) */}
      <div className="my-4">
        <div className="flex justify-between items-center relative">
          {/* Connector Line behind dots */}
          <div className="absolute left-0 right-0 h-[1px] bg-zinc-800 z-0"></div>
          
          {[1, 2, 3, 4, 5].map((num) => {
            const isCompleted = num <= completedCuts;
            const isNextFree = num === 5 && completedCuts === 4;

            return (
              <div key={num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-all duration-500 border ${
                    isCompleted
                      ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                      : isNextFree
                      ? 'bg-black text-white border-white animate-pulse border-dashed shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {isNextFree ? (
                    <Zap size={14} className="text-white" />
                  ) : (
                    num
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Text description */}
        <div className="mt-4 text-center">
          {completedCuts === 4 ? (
            <p className="text-xs text-white uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
              <Zap size={12} className="text-white animate-bounce" /> ¡Tu próximo corte de cabello es completamente gratis!
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Llevas <span className="text-white font-bold">{completedCuts}</span> de <span className="text-white font-bold">{totalCutsInCycle - 1}</span> cortes. ¡El 5to tiene descuento del 100%!
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-zinc-900 pt-3 text-xs uppercase tracking-widest text-zinc-400">
        <div>
          <span>Balance de Puntos</span>
          <div className="text-white font-bold text-sm tracking-normal mt-0.5">{pointsBalance} PTS</div>
        </div>
        <div className="text-[10px] text-right">
          JOTABARBER CLUB
        </div>
      </div>
    </div>
  );
};
