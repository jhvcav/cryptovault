import React from 'react';
import { Calendar, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { Investment, InvestmentPlan } from '../../contexts/InvestmentContext';

interface InvestmentCardProps {
  investment: Investment;
  plan: InvestmentPlan;
  calculatedReturns: number;
  onWithdraw: (investmentId: string) => void;
  onWithdrawCapital: (investmentId: string) => void; // Nouvelle prop
  isWithdrawing: boolean;
  isWithdrawingCapital: boolean; // Nouvelle prop
}

const InvestmentCard = ({ 
  investment, 
  plan, 
  calculatedReturns, 
  onWithdraw, 
  onWithdrawCapital, // Nouvelle prop
  isWithdrawing,
  isWithdrawingCapital // Nouvelle prop
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

  // Vérifier si la période de blocage est terminée
  const isLockPeriodOver = () => {
    const now = new Date();
    const endDate = new Date(investment.endDate);
    return now >= endDate;
  };

  const daysRemaining = calculateDaysRemaining();
  const progressPercentage = calculateProgress();
  const canWithdraw = calculatedReturns >= 0.4; // Condition pour autoriser le retrait
  const lockPeriodOver = isLockPeriodOver();

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border-2 border-t-slate-600 border-l-slate-600 border-r-slate-900 border-b-slate-900 shadow-2xl">
      <div className="p-5">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-purple-600">Plan {plan.name} V1</h3>
          <div className="bg-blue-600 rounded-full px-3 py-1 text-xs font-semibold text-white">
            {plan.apr}% Récompenses approx.
          </div>
        </div>
        
        {/* Montant investi */}
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-1">Montant Déposé</div>
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
              <span>Récompenses Actuels</span>
            </div>
            <div className="text-green-400 font-medium">
              {calculatedReturns.toFixed(4)} {investment.token}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400 flex items-center">
              <DollarSign size={14} className="mr-1" />
              <span>Récompenses Quotidiens</span>
            </div>
            <div className="text-white">
              {investment.dailyReturn.toFixed(4)} {investment.token}
            </div>
          </div>
        </div>
        
        {/* Boutons de retrait */}
        <div className="space-y-2">
          {/* Bouton de retrait des rendements */}
          <button
            onClick={() => onWithdraw(investment.id)}
            disabled={!canWithdraw || isWithdrawing}
            className={`w-full py-2 rounded-lg font-medium transition-all duration-200 ${
              canWithdraw
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 border-2 border-green-400/50 ring-1 ring-green-300/20 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 transform' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-inner border-2 border-slate-600 ring-1 ring-slate-500/30'
            }`}
          >
            {isWithdrawing
              ? 'Traitement en cours...'
              : canWithdraw
                ? `Récolter récompenses (${calculatedReturns.toFixed(2)} ${investment.token})`
                : `Récolte récompenses (> 0.4 ${investment.token})`
            }
          </button>
          
          {/* Bouton de retrait du capital - affiché uniquement si la période de blocage est terminée */}
          {lockPeriodOver ? (
            <button
              onClick={() => onWithdrawCapital(investment.id)}
              disabled={isWithdrawingCapital}
              className={`w-full py-2 rounded-lg font-medium transition-all duration-200 
                ${isWithdrawingCapital
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                }`}
            >
              {isWithdrawingCapital
                ? 'Traitement en cours...'
                : `Retirer le dépôt (${investment.amount.toFixed(2)} ${investment.token})`
              }
            </button>
          ) : (
            <div className="text-xs text-slate-400 text-center mt-1">
              La récolte du dépôt sera disponible le {formatDate(investment.endDate)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentCard;