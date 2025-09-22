
import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const isAboveThreshold = percentage >= 60;
  const barColor = isAboveThreshold ? 'bg-emerald-500' : 'bg-amber-500';
  const progress = Math.min(percentage, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-slate-700">Progreso de Ejecución</span>
        <span className={`text-sm font-medium ${isAboveThreshold ? 'text-emerald-700' : 'text-amber-700'}`}>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-4 relative">
        <div 
          className="absolute top-0 left-0 h-4 rounded-full border-2 border-slate-300" 
          style={{ width: '60%' }}
        >
            <div className="absolute -right-1.5 -top-5 text-xs text-slate-500">60%</div>
        </div>
        <div 
          className={`h-4 rounded-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
