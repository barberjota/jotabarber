import React from 'react';
import { ProductTable } from '../../components/admin/ProductTable';
import { Box } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Box className="text-zinc-400" /> Productos (Stock)
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Administra el inventario de productos, categorías (Cabello, Ropa, Otros), precios y niveles de stock.
          </p>
        </div>
      </div>

      <ProductTable />
    </div>
  );
};
