import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 disabled:pointer-events-none rounded-none';
  
  const variants = {
    primary: 'bg-white text-black hover:bg-zinc-200 border border-white',
    secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800',
    outline: 'bg-transparent text-white border border-zinc-700 hover:bg-zinc-900 hover:border-zinc-500',
    danger: 'bg-red-950 text-red-200 border border-red-900 hover:bg-red-900 hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
