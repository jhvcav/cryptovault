//src/components/dashboard/InvestmentCardV2.tsx
import React from 'react';
import { Calendar, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { Investment, InvestmentPlan } from '../../contexts/InvestmentContextV2';

interface InvestmentCardProps {
  investment: Investment;
  plan: InvestmentPlan;
  calculatedReturns: number;
  onWithdraw: (investmentId: string) => void;
  onWithdrawCapital: (investmentId: string) => void;
  isWithdrawing: boolean;
  isWithdrawingCapital: boolean;
  nftMultiplier?: number; // ✅ AJOUTÉ - Multiplicateur NFT
}

const InvestmentCard = ({ 
  investment, 
  plan, 
  calculatedReturns, 
  onWithdraw, 
  onWithdrawCapital,
  isWithdrawing,
  isWithdrawingCapital,
  nftMultiplier = 1 // ✅ AJOUTÉ - Défaut à 1 (pas de bonus)
}: InvestmentCardProps) => {
  // ✅ AJOUTÉ - Calcul du bonus NFT
  const hasNFTBonus = nftMultiplier > 1;
  const bonusPercentage = hasNFTBonus ? ((nftMultiplier - 1) * 100) : 0;
  const effectiveAPR = plan.apr * nftMultiplier;
  const dailyReturnWithBonus = investment.dailyReturn * nftMultiplier;

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
  const canWithdraw = calculatedReturns >= 0.4;
  const lockPeriodOver = isLockPeriodOver();

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-2xl ${
      hasNFTBonus 
        ? 'border-2 border-t-green-600 border-l-green-600 border-r-green-900 border-b-green-900' 
        : 'border-2 border-t-slate-600 border-l-slate-600 border-r-slate-900 border-b-slate-900'
    }`}>
      <div className="p-5">
        {/* ✅ AJOUTÉ - Badge bonus NFT */}
        {hasNFTBonus && (
          <div className="bg-green-600 text-white px-3 py-1 text-xs font-semibold text-center mb-3 rounded">
            🎁 Bonus NFT: +{bonusPercentage.toFixed(0)}% actif
          </div>
        )}

        {/* En-tête */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-purple-600">Plan {plan.name} V2</h3>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
            hasNFTBonus ? 'bg-green-600' : 'bg-blue-600'
          }`}>
            {/* ✅ MODIFIÉ - Afficher l'APR avec bonus NFT */}
            Autour de {effectiveAPR.toFixed(1)}% récompenses
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
              className={`h-2.5 rounded-full ${
                hasNFTBonus 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
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
              {/* ✅ AJOUTÉ - Indication du bonus */}
              {hasNFTBonus && (
                <span className="ml-2 text-green-400 text-xs">
                  (+{bonusPercentage.toFixed(0)}%)
                </span>
              )}
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
              {/* ✅ MODIFIÉ - Afficher les récompenses quotidiennes avec bonus */}
              {dailyReturnWithBonus.toFixed(4)} {investment.token}
              {hasNFTBonus && (
                <div className="text-xs text-green-400">
                  Base: {investment.dailyReturn.toFixed(4)}
                </div>
              )}
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
                ? hasNFTBonus
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 border-2 border-green-400/50 ring-1 ring-green-300/20 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 transform'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 border-2 border-green-400/50 ring-1 ring-green-300/20 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 transform'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-inner border-2 border-slate-600 ring-1 ring-slate-500/30'
            }`}
          >
            {isWithdrawing
              ? 'Traitement en cours...'
              : canWithdraw
                ? `Récolter les récompenses (${calculatedReturns.toFixed(2)} ${investment.token})${hasNFTBonus ? ' 🎁' : ''}`
                : `Récolte des récompenses (> 0.4 ${investment.token})`
            }
          </button>
          
          {/* Bouton de retrait du capital */}
          {lockPeriodOver ? (
            <button
              onClick={() => onWithdrawCapital(investment.id)}
              disabled={isWithdrawingCapital}
              className={`w-full py-2 rounded-lg font-medium transition-all duration-200 
                ${isWithdrawingCapital
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : hasNFTBonus
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border border-green-400/30'
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

        {/* ✅ AJOUTÉ - Résumé du bonus NFT si applicable */}
        {hasNFTBonus && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
            <div className="text-center">
              <div className="text-green-400 text-xs font-medium">
                🎁 Bonus NFT actif
              </div>
              <div className="text-green-300 text-xs mt-1">
                Vos récompenses sont augmentées de {bonusPercentage.toFixed(0)}% grâce à vos NFT
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentCard;