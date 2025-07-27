import React from 'react';

interface InvestmentChartProps {
  data: {
    labels: string[];
    values: number[];
  };
}

const InvestmentChart = ({ data }: InvestmentChartProps) => {
  // Trouver la valeur maximale pour dimensionner correctement le graphique
  const maxValue = Math.max(...data.values);
  
  return (
    <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
      <h3 className="text-white font-medium mb-4">Rendements des Investissements</h3>
      
      <div className="relative h-60">
        {/* Étiquettes de l'axe Y */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-2">
          <div>{maxValue.toFixed(2)}</div>
          <div>{(maxValue * 0.75).toFixed(2)}</div>
          <div>{(maxValue * 0.5).toFixed(2)}</div>
          <div>{(maxValue * 0.25).toFixed(2)}</div>
          <div>0</div>
        </div>
        
        {/* Lignes de la grille */}
        <div className="absolute left-8 right-0 top-0 h-full flex flex-col justify-between py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-px bg-slate-700"></div>
          ))}
        </div>
        
        {/* Barres */}
        <div className="absolute left-12 right-0 top-4 bottom-6 flex items-end space-x-2">
          {data.values.map((value, index) => {
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-indigo-600 rounded-sm hover:opacity-90 transition-opacity relative group"
                  style={{ height: `${percentage}%` }}
                >
                  {/* Info-bulle */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {value.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Étiquettes de l'axe X */}
        <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-slate-400">
          {data.labels.map((label, index) => (
            <div key={index} className="text-center" style={{ width: `${100 / data.labels.length}%` }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestmentChart;