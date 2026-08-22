import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border rounded-none';

  const variants = {
    default: 'bg-zinc-900 text-zinc-300 border-zinc-800',
    info: 'bg-white text-black border-white',
    success: 'bg-zinc-950 text-white border-zinc-200', // B&W exitoso
    warning: 'bg-zinc-950 text-zinc-400 border-zinc-600',
    error: 'bg-red-950/30 text-red-400 border-red-900', // El peligro se mantiene rojo sutil para alertar
  };

  return <span className={`${baseStyles} ${variants[variant]}`}>{children}</span>;
};
