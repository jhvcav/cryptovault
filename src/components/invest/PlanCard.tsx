// components/invest/PlanCard.tsx - Version mise à jour avec support NFT
import React from 'react';
import { useNFTAccess } from '../../hooks/useNFT';
import { useWallet } from '../../contexts/WalletContext';
import { 
  Clock, 
  TrendingUp, 
  Shield, 
  Star,
  Lock,
  Crown,
  Gem,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface InvestmentPlan {
  id: number;
  name: string;
  description: string;
  apr: number;
  minInvestment: number;
  maxInvestment: number;
  lockPeriodDays: number;
  category: 'starter' | 'standard' | 'premium' | 'privilege';
  features: string[];
  risks: string[];
  requiredNFTTier: number;
  active: boolean;
}

interface PlanCardProps {
  plan: InvestmentPlan;
  onInvest: (planId: number) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onInvest }) => {
  const { address } = useWallet();
  const { hasNFT, highestTier, multiplier, access } = useNFTAccess(address);

  // Vérifier l'accès au plan
  const hasAccess = hasNFT && highestTier >= plan.requiredNFTTier;
  
  // Calculer l'APR avec le multiplicateur NFT
  const effectiveAPR = hasAccess ? plan.apr * multiplier : plan.apr;
  const bonusPercentage = hasAccess ? ((multiplier - 1) * 100) : 0;

  // Déterminer le style selon la catégorie
  const getCategoryStyle = () => {
    switch (plan.category) {
      case 'starter':
        return {
          gradient: 'from-amber-500 to-amber-700',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/20',
          icon: '🥉',
          badge: 'Starter'
        };
      case 'standard':
        return {
          gradient: 'from-slate-400 to-slate-600',
          border: 'border-slate-400/30',
          glow: 'shadow-slate-400/20',
          icon: '🥈',
          badge: 'Standard'
        };
      case 'premium':
        return {
          gradient: 'from-yellow-500 to-yellow-700',
          border: 'border-yellow-500/30',
          glow: 'shadow-yellow-500/20',
          icon: '🥇',
          badge: 'Premium'
        };
      case 'privilege':
        return {
          gradient: 'from-purple-500 to-pink-600',
          border: 'border-purple-500/30',
          glow: 'shadow-purple-500/20',
          icon: '💎',
          badge: 'Privilège'
        };
      default:
        return {
          gradient: 'from-blue-500 to-blue-700',
          border: 'border-blue-500/30',
          glow: 'shadow-blue-500/20',
          icon: '📈',
          badge: 'Plan'
        };
    }
  };

  const style = getCategoryStyle();

  // Déterminer quel NFT est requis
  const getRequiredNFTName = (tier: number) => {
    switch (tier) {
      case 1: return 'NFT Bronze';
      case 2: return 'NFT Argent';
      case 3: return 'NFT Or';
      case 4: return 'NFT Privilège';
      default: return 'NFT';
    }
  };

  return (
    <div className={`relative bg-gradient-to-br ${style.gradient} p-1 rounded-2xl ${style.glow} hover:shadow-2xl transition-all duration-300 ${hasAccess ? '' : 'opacity-75'}`}>
      {/* Badge catégorie */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
        <span>{style.icon}</span>
        <span>{style.badge}</span>
      </div>

      {/* Badge NFT requis pour les plans non accessibles */}
      {!hasAccess && (
        <div className="absolute -top-3 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
          <Lock size={12} />
          <span>{getRequiredNFTName(plan.requiredNFTTier)}</span>
        </div>
      )}

      {/* Badge bonus NFT pour les plans accessibles */}
      {hasAccess && bonusPercentage > 0 && (
        <div className="absolute -top-3 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
          <TrendingUp size={12} />
          <span>+{bonusPercentage.toFixed(0)}%</span>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
          <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
          
          {/* Récompenses Display */}
          <div className="space-y-2">
            {hasAccess && bonusPercentage > 0 ? (
              <div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-green-400">{effectiveAPR.toFixed(1)}%</span>
                  <span className="text-slate-400">Récompenses estimées</span>
                </div>
                <div className="text-sm text-slate-500">
                  Base: {plan.apr}% • Bonus NFT: +{bonusPercentage.toFixed(0)}%
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span className={`text-2xl font-bold ${hasAccess ? 'text-white' : 'text-slate-500'}`}>
                  {plan.apr}%
                </span>
                <span className="text-slate-400">Récompenses estimées</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock size={16} className="text-blue-400 mr-1" />
              <span className="text-slate-400 text-sm">Période</span>
            </div>
            <span className="text-white font-semibold">{plan.lockPeriodDays} jours</span>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp size={16} className="text-green-400 mr-1" />
              <span className="text-slate-400 text-sm">Min/Max</span>
            </div>
            <span className="text-white font-semibold text-xs">
              ${plan.minInvestment} - ${plan.maxInvestment}
            </span>
          </div>
        </div>

        {/* Access Status */}
        <div className="mb-6">
          {hasAccess ? (
            <div className="flex items-center space-x-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-green-300 text-sm font-medium">Accès autorisé</span>
              {multiplier > 1 && (
                <span className="text-green-400 text-xs">• Bonus {multiplier}x actif</span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <Lock size={16} className="text-red-400" />
              <span className="text-red-300 text-sm font-medium">
                {getRequiredNFTName(plan.requiredNFTTier)} requis
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          <h4 className="text-white font-medium text-sm mb-2">Avantages :</h4>
          {plan.features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Star size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
          
          {hasAccess && bonusPercentage > 0 && (
            <div className="flex items-start space-x-2 border-t border-slate-600 pt-2 mt-3">
              <Gem size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-green-300 text-sm font-medium">
                Bonus NFT: +{bonusPercentage.toFixed(0)}% sur tous les gains
              </span>
            </div>
          )}
        </div>

        {/* Risks */}
        <div className="space-y-2 mb-6">
          <h4 className="text-slate-400 font-medium text-sm mb-2">Risques :</h4>
          {plan.risks.slice(0, 2).map((risk, index) => (
            <div key={index} className="flex items-start space-x-2">
              <AlertCircle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-400 text-xs">{risk}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => hasAccess ? onInvest(plan.id) : null}
          disabled={!hasAccess || !plan.active}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            hasAccess && plan.active
              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {!hasAccess ? (
            <>
              <Lock size={18} />
              <span>NFT Requis</span>
            </>
          ) : !plan.active ? (
            <>
              <AlertCircle size={18} />
              <span>Non Disponible</span>
            </>
          ) : (
            <>
              <ArrowRight size={18} />
              <span>Investir Maintenant</span>
            </>
          )}
        </button>

        {/* NFT Upgrade Suggestion */}
        {!hasAccess && (
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.href = '/nft-marketplace'}
              className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center justify-center space-x-1"
            >
              <Crown size={14} />
              <span>Acquérir {getRequiredNFTName(plan.requiredNFTTier)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanCard;