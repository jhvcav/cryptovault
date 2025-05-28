import React from 'react';
import { Calendar, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { Investment, InvestmentPlan } from '../../contexts/InvestmentContext';

interface InvestmentCardProps {
  investment: Investment;
  plan: InvestmentPlan;
  calculatedReturns: number;
  onWithdraw: (investmentId: string) => void;
  isWithdrawing: boolean;
}

const InvestmentCard = ({ 
  investment, 
  plan, 
  calculatedReturns, 
  onWithdraw, 
  isWithdrawing 
}: InvestmentCardProps) => {
  // Formater les dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculer les jours restants
  const calculateDaysRemaining = () => {
    const now = new Date();
    const endDate = new Date(investment.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  // Calculer le pourcentage de progression
  const calculateProgress = () => {
    const startDate = new Date(investment.startDate).getTime();
    const endDate = new Date(investment.endDate).getTime();
    const now = new Date().getTime();
    
    if (now >= endDate) return 100;
    if (now <= startDate) return 0;
    
    const total = endDate - startDate;
    const current = now - startDate;
    return Math.floor((current / total) * 100);
  };

  const daysRemaining = calculateDaysRemaining();
  const progressPercentage = calculateProgress();
  const canWithdraw = calculatedReturns >= 1;

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-lg">
      <div className="p-5">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Plan {plan.name}</h3>
          <div className="bg-blue-600 rounded-full px-3 py-1 text-xs font-semibold text-white">
            {plan.apr}% APR
          </div>
        </div>
        
        {/* Montant investi */}
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-1">Montant Investi</div>
          <div className="text-xl font-bold text-white">
            {investment.amount.toFixed(2)} {investment.token}
          </div>
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center text-sm text-slate-400 mb-1">
              <Calendar size={14} className="mr-1" />
              <span>Date de Début</span>
            </div>
            <div className="text-sm text-white">{formatDate(investment.startDate)}</div>
          </div>
          <div>
            <div className="flex items-center text-sm text-slate-400 mb-1">
              <Calendar size={14} className="mr-1" />
              <span>Date de Fin</span>
            </div>
            <div className="text-sm text-white">{formatDate(investment.endDate)}</div>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <div className="text-slate-400 flex items-center">
              <Clock size={14} className="mr-1" />
              <span>Temps Restant</span>
            </div>
            <div className="text-white">{daysRemaining} jours</div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Rendements */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-slate-400 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              <span>Rendements Actuels</span>
            </div>
            <div className="text-green-400 font-medium">
              {calculatedReturns.toFixed(4)} {investment.token}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400 flex items-center">
              <DollarSign size={14} className="mr-1" />
              <span>Rendement Quotidien</span>
            </div>
            <div className="text-white">
              {investment.dailyReturn.toFixed(4)} {investment.token}
            </div>
          </div>
        </div>
        
        {/* Bouton de retrait */}
        <button
          onClick={() => onWithdraw(investment.id)}
          disabled={!canWithdraw || isWithdrawing}
          className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
            canWithdraw
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isWithdrawing
            ? 'Traitement en cours...'
            : canWithdraw
              ? `Retirer ${calculatedReturns.toFixed(2)} ${investment.token}`
              : `Retrait (min. 1 ${investment.token})`
          }
        </button>
      </div>
    </div>
  );
};

export default InvestmentCard;