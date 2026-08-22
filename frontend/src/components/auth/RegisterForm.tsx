import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface RegisterFormProps {
  onSuccess?: () => void;
  onToggleLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onToggleLogin }) => {
  const { register } = useAuth();
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(password, name, phone);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
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
          Nombre Completo
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 rounded-none"
          placeholder="Juan Pérez"
        />
      </div>

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
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        {submitting ? 'Creando Cuenta...' : 'Registrarse'}
      </Button>

      {onToggleLogin && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onToggleLogin}
            className="text-xs text-zinc-400 hover:text-white underline transition-colors"
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </button>
        </div>
      )}
    </form>
  );
};
