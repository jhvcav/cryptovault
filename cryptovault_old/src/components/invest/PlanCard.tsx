import React, { useState } from 'react';
import { ArrowRight, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { InvestmentPlan } from '../../contexts/InvestmentContext';

interface PlanCardProps {
  plan: InvestmentPlan;
  onInvest: (planId: number) => void;
}

const PlanCard = ({ plan, onInvest }: PlanCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden shadow-lg border ${
      plan.active 
        ? 'border-slate-700 hover:border-blue-500' 
        : 'border-red-500/50'
    } transition-all duration-300 group`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Plan {plan.name}</h3>
          <div className="bg-blue-600 rounded-full px-3 py-1 text-xs font-semibold text-white">
            {plan.apr}% APR
          </div>
        </div>
        
        <div className="flex items-center mb-4 text-slate-300">
          <Clock size={18} className="mr-2" />
          <span>{plan.duration} jours de blocage</span>
        </div>
        
        <div className="flex items-center mb-6 text-slate-300">
          <TrendingUp size={18} className="mr-2" />
          <span>Récompenses quotidiennes</span>
        </div>
        
        {!plan.active && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">
              Ce plan n'est pas disponible actuellement
            </p>
          </div>
        )}
        
        <button 
          className={`w-full py-2 rounded-lg font-medium flex items-center justify-center transition-all duration-200 transform group-hover:scale-105 ${
            plan.active
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          onClick={() => plan.active && onInvest(plan.id)}
          disabled={!plan.active}
        >
          {plan.active ? (
            <>
              Investir Maintenant
              <ArrowRight size={18} className="ml-2" />
            </>
          ) : (
            'Plan Non Disponible'
          )}
        </button>
        
        <button 
          className="w-full flex items-center justify-center mt-4 text-slate-400 hover:text-white transition-colors"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <>
              <span className="mr-1">Moins de détails</span>
              <ChevronUp size={16} />
            </>
          ) : (
            <>
              <span className="mr-1">Plus de détails</span>
              <ChevronDown size={16} />
            </>
          )}
        </button>
      </div>
      
      {expanded && (
        <div className="px-6 pb-6 text-slate-300 text-sm">
          <p className="mb-4">{plan.description}</p>
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Exemple</h4>
            <p>Investissement de 1 000 USDT</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Rendement quotidien: ~{((1000 * (plan.apr / 100)) / 365).toFixed(2)} USDT</li>
              <li>Rendement total après {plan.duration} jours: ~{((1000 * (plan.apr / 100) * plan.duration) / 365).toFixed(2)} USDT</li>
              <li>Frais de plateforme (2%): 20 USDT</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCard;