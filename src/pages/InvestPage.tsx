import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvestment } from '../contexts/InvestmentContext'; // Votre contexte fonctionnel
import { useNFTAccess } from '../hooks/useNFTAccess'; // Hook NFT
import { useWallet } from '../contexts/WalletContext';
import InvestmentModal from '../components/invest/InvestmentModal'; // Votre modal fonctionnel
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Lock, 
  AlertCircle,
  Shield,
  Star,
  Crown,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const InvestPage: React.FC = () => {
  // Utiliser VOTRE contexte d'investissement qui fonctionne
  const { plans, invest, loading: investmentLoading } = useInvestment();
  
  // Utiliser le hook NFT pour le contrôle d'accès
  const { 
    hasNFT, 
    highestTier, 
    multiplier, 
    accessiblePlans, 
    ownedNFTs, 
    loading: nftLoading,
    error: nftError,
    refetch: refetchNFT
  } = useNFTAccess();
  
  const { address, isConnected } = useWallet();
  
  // État du modal
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fonction pour investir
  const handleInvest = async (planId: number, amount: number, token: 'USDT' | 'USDC'): Promise<boolean> => {
    console.log('handleInvest appelé avec:', { planId, amount, token });
    
    try {
      const result = await invest(planId, amount, token);
      console.log('Résultat de invest():', result);
      return result;
    } catch (error) {
      console.error('Erreur dans handleInvest:', error);
      return false;
    }
  };

  // Ouvrir le modal pour un plan spécifique
  const openModal = (plan: any) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setModalOpen(false);
  };

  // Filtrer les plans selon l'accès NFT
  const availablePlans = plans.filter(plan => accessiblePlans.includes(plan.id));
  const allPlansWithAccess = plans.map(plan => ({
    ...plan,
    isAccessible: accessiblePlans.includes(plan.id)
  }));

  // Fonction pour obtenir le NFT requis selon l'ID du plan
  const getRequiredNFTForPlan = (planId: number): { tier: number; name: string; icon: string } => {
    switch (planId) {
      case 0: // Starter
        return { tier: 1, name: 'NFT Bronze', icon: '🥉' };
      case 1: // Standard  
        return { tier: 2, name: 'NFT Argent', icon: '🥈' };
      case 2: // Premium
        return { tier: 3, name: 'NFT Or', icon: '🥇' };
      default:
        return { tier: 1, name: 'NFT Bronze', icon: '🥉' };
    }
  };

  // Fonction pour obtenir le nom du NFT selon le tier
  const getNFTName = (tier: number): string => {
    switch (tier) {
      case 1: return 'NFT Bronze';
      case 2: return 'NFT Argent';
      case 3: return 'NFT Or';
      case 4: return 'NFT Privilège';
      default: return 'NFT';
    }
  };

  // Fonction pour obtenir l'icône du NFT
  const getNFTIcon = (tier: number): string => {
    switch (tier) {
      case 1: return '🥉';
      case 2: return '🥈';
      case 3: return '🥇';
      case 4: return '💎';
      default: return '📋';
    }
  };

  // Composant PlanCard
  const PlanCard: React.FC<{ plan: any; isAccessible: boolean }> = ({ plan, isAccessible }) => {
    const effectiveAPR = isAccessible ? plan.apr * multiplier : plan.apr;
    const bonusPercentage = isAccessible ? ((multiplier - 1) * 100) : 0;
    const requiredNFT = getRequiredNFTForPlan(plan.id);

    return (
      <div className={`bg-slate-800 rounded-lg overflow-hidden shadow-lg border transition-all duration-300 ${
        isAccessible 
          ? 'border-slate-700 hover:border-blue-500 hover:shadow-xl' 
          : 'border-slate-600 opacity-75'
      }`}>
        {/* Badge NFT requis ou bonus */}
        {isAccessible && bonusPercentage > 0 && (
          <div className="bg-green-600 text-white px-3 py-1 text-xs font-semibold text-center">
            🎁 Bonus NFT: +{bonusPercentage.toFixed(0)}%
          </div>
        )}
        {!isAccessible && (
          <div className="bg-orange-600 text-white px-3 py-1 text-xs font-semibold text-center flex items-center justify-center space-x-1">
            <span>{requiredNFT.icon}</span>
            <span>{requiredNFT.name} requis</span>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-bold ${isAccessible ? 'text-white' : 'text-slate-400'}`}>
              Plan {plan.name}
            </h3>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
              isAccessible ? 'bg-blue-600' : 'bg-slate-600'
            }`}>
              {isAccessible ? effectiveAPR.toFixed(1) : plan.apr}% Récompenses
            </div>
          </div>
          
          {/* Description */}
          {plan.description && (
            <p className={`text-sm mb-4 ${isAccessible ? 'text-slate-400' : 'text-slate-500'}`}>
              {plan.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="space-y-3 mb-6">
            <div className={`flex items-center ${isAccessible ? 'text-slate-300' : 'text-slate-500'}`}>
              <Clock size={18} className={`mr-2 ${isAccessible ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{plan.duration} jours de blocage</span>
            </div>
            
            <div className={`flex items-center ${isAccessible ? 'text-slate-300' : 'text-slate-500'}`}>
              <TrendingUp size={18} className={`mr-2 ${isAccessible ? 'text-green-400' : 'text-slate-500'}`} />
              <span>Récompenses quotidiennes</span>
            </div>

            <div className={`flex items-center ${isAccessible ? 'text-slate-300' : 'text-slate-500'}`}>
              <DollarSign size={18} className={`mr-2 ${isAccessible ? 'text-yellow-400' : 'text-slate-500'}`} />
              <span>Minimum: {plan.minAmount} USDT/USDC</span>
            </div>
          </div>

          {/* Exemple de calcul avec bonus NFT */}
          {isAccessible && (
            <div className="bg-slate-700 rounded-lg p-4 mb-4">
              <h4 className="text-white font-medium mb-2">Exemple (1000 USDT)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Récompense quotidien:</span>
                  <span className="text-green-400">
                    ~{((1000 * (effectiveAPR / 100)) / 365).toFixed(3)} USDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total après {plan.duration}j:</span>
                  <span className="text-green-400 font-semibold">
                    ~{((1000 * (effectiveAPR / 100) * plan.duration) / 365).toFixed(2)} USDT
                  </span>
                </div>
                {bonusPercentage > 0 && (
                  <div className="text-xs text-green-300 pt-1 border-t border-slate-600">
                    Bonus NFT inclus: +{bonusPercentage.toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Aperçu grisé pour plans non accessibles */}
          {!isAccessible && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-600">
              <h4 className="text-slate-400 font-medium mb-2">Aperçu avec {requiredNFT.name}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rendement quotidien:</span>
                  <span className="text-slate-400">
                    ~{((1000 * (plan.apr / 100)) / 365).toFixed(3)} USDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total après {plan.duration}j:</span>
                  <span className="text-slate-400 font-semibold">
                    ~{((1000 * (plan.apr / 100) * plan.duration) / 365).toFixed(2)} USDT
                  </span>
                </div>
                <div className="text-xs text-orange-400 pt-1 border-t border-slate-600">
                  {requiredNFT.icon} Accessible avec {requiredNFT.name}
                </div>
              </div>
            </div>
          )}
          
          {/* Bouton d'action */}
          {isAccessible ? (
            <button 
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-lg transform hover:scale-105"
              onClick={() => openModal(plan)}
            >
              <ArrowRight size={18} className="mr-2" />
              Déposer Maintenant
            </button>
          ) : (
            <Link
              to="/nft-collection"
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white hover:shadow-lg transform hover:scale-105"
            >
              <Crown size={18} className="mr-2" />
              Plan accessible avec {requiredNFT.name}
            </Link>
          )}
        </div>
      </div>
    );
  };

  // Gestion des états de chargement et d'erreur
  if (nftLoading || investmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement des informations NFT...</p>
        </div>
      </div>
    );
  }

  if (nftError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur de chargement</h2>
          <p className="text-slate-400 mb-4">{nftError}</p>
          <button 
            onClick={refetchNFT}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connectez votre wallet</h2>
          <p className="text-slate-400 mb-4">
            Connectez votre wallet MetaMask pour accéder aux plans d'investissement.
          </p>
        </div>
      </div>
    );
  }

  if (!hasNFT) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Lock size={48} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">NFT d'accès requis</h2>
          <p className="text-slate-400 mb-6">
            Vous devez posséder un NFT d'accès pour utiliser les plans de récompense.
          </p>
          <Link
            to="/nft-collection"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
          >
            <ExternalLink size={18} className="mr-2" />
            Découvrir les NFT
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header avec informations NFT */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Plans d'Investissement
            </h1>
            <p className="text-slate-400 text-lg">
              Choisissez votre plan et maximisez vos rendements avec vos bonus NFT
            </p>
          </div>

          {/* Informations NFT de l'utilisateur */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{getNFTIcon(highestTier)}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {getNFTName(highestTier)} Actif
                  </h3>
                  <p className="text-slate-300">
                    Multiplicateur de récompenses: <span className="text-green-400 font-semibold">{multiplier}x</span>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Accès à {accessiblePlans.length} plan{accessiblePlans.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <button
                  onClick={refetchNFT}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <RefreshCw size={16} />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            {/* Afficher tous les NFT possédés */}
            {ownedNFTs.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-slate-400 text-sm mb-2">NFT possédés:</p>
                <div className="flex space-x-2">
                  {ownedNFTs.map((tier, index) => (
                    <span key={index} className="px-2 py-1 bg-slate-700 rounded text-slate-300 text-xs">
                      {getNFTIcon(tier)} {getNFTName(tier)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Liste des plans */}
        <section>
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl px-8 py-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-blue-400" size={24} />
                <h2 className="text-2xl font-bold text-white">
                  Plans d'Investissement
                </h2>
              </div>
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                {allPlansWithAccess.length}
              </div>
            </div>
            <p className="text-slate-400 mt-3">
              {availablePlans.length} plan{availablePlans.length > 1 ? 's' : ''} accessible{availablePlans.length > 1 ? 's' : ''} avec votre {getNFTName(highestTier)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPlansWithAccess.map((planWithAccess) => (
              <PlanCard 
                key={planWithAccess.id} 
                plan={planWithAccess} 
                isAccessible={planWithAccess.isAccessible}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Modal d'investissement */}
      {selectedPlan && (
        <InvestmentModal
          isOpen={modalOpen}
          onClose={closeModal}
          plan={selectedPlan}
          onInvest={handleInvest}
        />
      )}
    </div>
  );
};

export default InvestPage;