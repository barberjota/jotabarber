import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onToggleRegister }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(phone, password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">
          Teléfono / Celular
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none"
          placeholder="Ej: 123456789"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">
          Contraseña
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none"
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        {submitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
      </Button>

      {onToggleRegister && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onToggleRegister}
            className="text-xs text-zinc-400 hover:text-white underline transition-colors"
          >
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>
      )}
    </form>
  );
};
