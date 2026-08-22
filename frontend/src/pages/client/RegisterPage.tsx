import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { Scissors } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/mi-cuenta');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-8 border-zinc-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-zinc-900 border border-zinc-800 w-10 h-10 flex items-center justify-center text-zinc-400 mx-auto">
            <Scissors size={20} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Únete al Club JotaBarber</h2>
          <p className="text-xs text-zinc-500">Regístrate para acumular cortes y obtener tu 5to corte gratis.</p>
        </div>

        <RegisterForm
          onSuccess={handleSuccess}
          onToggleLogin={() => navigate('/login')}
        />
      </Card>
    </div>
  );
};
