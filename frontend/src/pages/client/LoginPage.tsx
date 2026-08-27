import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { LoginForm } from '../../components/auth/LoginForm';
import { Scissors } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      if (u.role === 'ADMIN' || u.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/mi-cuenta');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8 border-zinc-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-zinc-900 border border-zinc-800 w-10 h-10 flex items-center justify-center text-zinc-400 mx-auto">
            <Scissors size={20} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Acceso Administrativo</h2>
          <p className="text-xs text-zinc-500">Ingresa tus credenciales autorizadas.</p>
        </div>

        <LoginForm
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  );
};
