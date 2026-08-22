import React from 'react';
import { CustomerLoyaltyTable } from '../../components/admin/CustomerLoyaltyTable';
import { Users2 } from 'lucide-react';

export const CustomersLoyaltyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <Users2 className="text-zinc-400" /> Clientes & Fidelización
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Busca clientes, monitorea su progreso del programa y realiza ajustes de puntos/cortes.</p>
      </div>

      <CustomerLoyaltyTable />
    </div>
  );
};
