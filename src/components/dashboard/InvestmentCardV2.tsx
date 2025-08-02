//src/components/dashboard/InvestmentCardV2.tsx
import React from 'react';
import { Calendar, Clock, TrendingUp, DollarSign, Star, Wallet } from 'lucide-react';
import { InvestmentV2, InvestmentPlanV2 } from '../../contexts/InvestmentContextV2';

interface InvestmentCardV2Props {
  investment: InvestmentV2;
  plan: InvestmentPlanV2;
  calculatedReturns: number;
  onWithdraw: (investmentId: string) => Promise<void>;
  onWithdrawCapital: (investmentId: string) => Promise<void>;
  isWithdrawing: boolean;
  isWithdrawingCapital: boolean;
  nftMultiplier?: number; // Optionnel pour compatibilité
}

const InvestmentCardV2: React.FC<InvestmentCardV2Props> = ({
  investment,
  plan,
  calculatedReturns,
  onWithdraw,
  onWithdrawCapital,
  isWithdrawing,
  isWithdrawingCapital,
  nftMultiplier = 1
}) => {
  // ✅ UTILISER le multiplicateur du contrat (depuis le stake)
  const actualNFTMultiplier = investment.nftMultiplierAtStake || 1;
  const hasNFTBonus = actualNFTMultiplier > 1;
  
  // Calculer l'APR effectif avec le bonus NFT
  const baseAPR = plan.apr;
  const effectiveAPR = baseAPR * actualNFTMultiplier;
  const bonusPercentage = hasNFTBonus ? ((actualNFTMultiplier - 1) * 100) : 0;
  
  // Calculer les récompenses de base (sans NFT) pour affichage détaillé
  const baseRewards = hasNFTBonus ? (calculatedReturns / actualNFTMultiplier) : calculatedReturns;
  const bonusRewards = calculatedReturns - baseRewards;
  const baseDailyReturn = hasNFTBonus ? (investment.dailyReturn / actualNFTMultiplier) : investment.dailyReturn;
  const bonusDailyReturn = investment.dailyReturn - baseDailyReturn;

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
    <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-2xl transition-all duration-200 hover:shadow-3xl ${
      hasNFTBonus 
        ? 'border-2 border-t-green-600 border-l-green-600 border-r-green-900 border-b-green-900 ring-1 ring-green-400/20' 
        : 'border-2 border-t-slate-600 border-l-slate-600 border-r-slate-900 border-b-slate-900'
    }`}>
      <div className="p-5">
        {/* ✅ En-tête avec APR et bonus NFT */}
        <div className={`px-3 py-2 text-xs font-semibold text-white mb-3 text-center ${
          hasNFTBonus ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {hasNFTBonus && <Star size={14} className="text-yellow-300" />}
            <span>Autour de {effectiveAPR.toFixed(1)}% Récompenses</span>
            {hasNFTBonus && <Star size={14} className="text-yellow-300" />}
          </div>
          {hasNFTBonus && (
            <div className="text-xs opacity-90 mt-1">
              Base: {baseAPR}% + Bonus NFT: +{bonusPercentage.toFixed(0)}%
            </div>
          )}
        </div>

        {/* ✅ Badge bonus NFT distinctif */}
        {hasNFTBonus && (
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-2 text-xs font-bold text-center mb-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-center gap-2">
              <Star size={16} className="text-yellow-100" />
              <span>🎁 BONUS NFT ACTIF: +{bonusPercentage.toFixed(0)}%</span>
              <Star size={16} className="text-yellow-100" />
            </div>
            <div className="text-xs opacity-90 mt-1">
              Multiplicateur: {actualNFTMultiplier}x (appliqué au dépôt)
            </div>
          </div>
        )}

        {/* En-tête du plan */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-purple-600">Plan {plan.name} V2</h3>
            {hasNFTBonus && (
              <div className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                NFT {actualNFTMultiplier}x
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">ID: {investment.id}</div>
          </div>
        </div>
        
        {/* Montant investi */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-slate-400 mb-1">
            <Wallet size={14} className="mr-1" />
            <span>Montant Déposé</span>
          </div>
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
          <div className="flex justify-between text-sm mb-2">
            <div className="text-slate-400 flex items-center">
              <Clock size={14} className="mr-1" />
              <span>Progression</span>
            </div>
            <div className="text-white">
              {progressPercentage}% • {daysRemaining} jours restants
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 shadow-inner">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                hasNFTBonus 
                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 shadow-lg shadow-blue-500/30'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* ✅ Section récompenses détaillée */}
        <div className="mb-5 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <TrendingUp size={16} className="text-green-400 mr-2" />
            Récompenses
            {hasNFTBonus && (
              <span className="ml-2 text-xs text-yellow-400">
                (avec bonus NFT +{bonusPercentage.toFixed(0)}%)
              </span>
            )}
          </h4>
          
          {/* Récompenses actuelles */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-400">Récompenses Actuels:</span>
              <div className="text-right">
                <div className="text-green-400 font-medium">
                  {calculatedReturns.toFixed(6)} {investment.token}
                </div>
                {hasNFTBonus && (
                  <div className="text-xs text-slate-400">
                    Base: {baseRewards.toFixed(6)} + Bonus: {bonusRewards.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Récompenses quotidiennes avec détail NFT */}
          <div className="mb-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-400 flex items-center">
                <DollarSign size={14} className="mr-1" />
                <span>Récompenses Quotidiennes:</span>
              </div>
              <div className="text-right">
                <div className={`font-medium ${hasNFTBonus ? 'text-green-400' : 'text-white'}`}>
                  {investment.dailyReturn.toFixed(6)} {investment.token}/jour
                </div>
                {hasNFTBonus && (
                  <div className="text-xs text-slate-400">
                    Base: {baseDailyReturn.toFixed(6)} + Bonus: {bonusDailyReturn.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROI actuel */}
          <div className="pt-2 border-t border-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">ROI Actuel:</span>
              <span className="text-blue-400 font-medium">
                {((calculatedReturns / investment.amount) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Boutons de retrait */}
        <div className="space-y-3">
          {/* Bouton de retrait des récompenses */}
          <button
            onClick={() => onWithdraw(investment.id)}
            disabled={!canWithdraw || isWithdrawing}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
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
                ? (
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp size={16} />
                    <span>Récolter les récompenses ({calculatedReturns.toFixed(4)} {investment.token})</span>
                    {hasNFTBonus && <Star size={16} className="text-yellow-300" />}
                  </div>
                )
                : `Récolte des récompenses (min. 0.4 ${investment.token})`
            }
          </button>
          
          {/* Bouton de retrait du capital */}
          {lockPeriodOver ? (
            <button
              onClick={() => onWithdrawCapital(investment.id)}
              disabled={isWithdrawingCapital}
              className={`w-full py-3 rounded-lg font-medium transition-all duration-200 text-sm
                ${isWithdrawingCapital
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : hasNFTBonus
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-2 border-green-400/30 shadow-lg hover:shadow-xl active:scale-95 transform'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-95 transform'
                }`}
            >
              {isWithdrawingCapital
                ? 'Traitement en cours...'
                : (
                  <div className="flex items-center justify-center gap-2">
                    <Wallet size={16} />
                    <span>Retirer le dépôt ({investment.amount.toFixed(2)} {investment.token})</span>
                  </div>
                )
              }
            </button>
          ) : (
            <div className="text-xs text-slate-400 text-center p-3 bg-slate-800 rounded-lg border border-slate-700">
              <Clock size={14} className="inline mr-1" />
              La récolte du dépôt sera disponible le {formatDate(investment.endDate)}
            </div>
          )}
        </div>

        {/* ✅ Résumé détaillé du bonus NFT */}
        {hasNFTBonus && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-600/40 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold mb-2">
                <Star size={16} className="text-yellow-400" />
                <span>🎁 BONUS NFT ACTIF</span>
                <Star size={16} className="text-yellow-400" />
              </div>
              <div className="text-green-300 text-xs space-y-1">
                <div>Multiplicateur au dépôt: <span className="font-bold">{actualNFTMultiplier}x</span></div>
                <div>Bonus appliqué: <span className="font-bold">+{bonusPercentage.toFixed(0)}%</span></div>
                <div>Récompenses augmentées de <span className="font-bold text-yellow-300">{bonusDailyReturn.toFixed(6)} {investment.token}/jour</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentCardV2;