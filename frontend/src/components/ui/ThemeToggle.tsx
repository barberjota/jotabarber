import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    console.log('[ThemeToggle] Inicializando tema desde localStorage:', saved);
    return saved;
  });

  useEffect(() => {
    console.log('[ThemeToggle] Aplicando tema:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('[ThemeToggle] Clase "dark" agregada a html. Clases actuales:', document.documentElement.className);
    } else {
      document.documentElement.classList.remove('dark');
      console.log('[ThemeToggle] Clase "dark" eliminada de html. Clases actuales:', document.documentElement.className);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      console.log('[ThemeToggle] Alternando tema de', prev, 'a', next);
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center rounded-none bg-zinc-900/30"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
};
