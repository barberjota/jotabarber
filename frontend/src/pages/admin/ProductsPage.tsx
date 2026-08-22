import React, { useState } from 'react';
import { ProductTable } from '../../components/admin/ProductTable';
import { QuickSaleModal } from '../../components/admin/QuickSaleModal';
import { Button } from '../../components/ui/Button';
import { ShoppingBag, Box } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePOSSuccess = () => {
    // Forzar recarga de stock en la tabla
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & POS Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Box className="text-zinc-400" /> Productos & Inventario
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Monitorea el inventario y realiza ventas directas (POS) / canjes en caja.</p>
        </div>

        <Button
          onClick={() => setIsPOSOpen(true)}
          variant="primary"
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold"
        >
          <ShoppingBag size={16} /> Abrir Caja / POS
        </Button>
      </div>

      <ProductTable key={refreshKey} />

      {/* Modal POS */}
      <QuickSaleModal
        isOpen={isPOSOpen}
        onClose={() => setIsPOSOpen(false)}
        onSuccess={handlePOSSuccess}
      />
    </div>
  );
};
