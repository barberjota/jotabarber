import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultView = 'login',
  onSuccess,
}) => {
  const [view, setView] = useState<'login' | 'register'>(defaultView);

  const handleSuccess = () => {
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
      size="sm"
    >
      {view === 'login' ? (
        <LoginForm
          onSuccess={handleSuccess}
          onToggleRegister={() => setView('register')}
        />
      ) : (
        <RegisterForm
          onSuccess={handleSuccess}
          onToggleLogin={() => setView('login')}
        />
      )}
    </Modal>
  );
};
