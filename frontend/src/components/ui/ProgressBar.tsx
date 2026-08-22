import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  showValue = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1 text-xs uppercase tracking-wider text-zinc-400">
          {label && <span>{label}</span>}
          {showValue && (
            <span>
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-zinc-900 border border-zinc-800">
        <div
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
