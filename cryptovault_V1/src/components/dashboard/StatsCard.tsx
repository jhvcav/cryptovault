import React, { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value: string | number;
    positive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, icon, change, className = '' }: StatsCardProps) => {
  return (
    <div className={`bg-slate-800 rounded-lg p-5 border border-slate-700 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <h4 className="text-white text-2xl font-bold">{value}</h4>
          
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change.positive ? 'text-green-400' : 'text-red-400'}`}>
              <span>
                {change.positive ? '↑' : '↓'} {change.value}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-slate-700 rounded-lg text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;