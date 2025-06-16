// NFTMarketplace.tsx - Version complète corrigée
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useFidelityStatus } from '../hooks/useFidelityStatus';
import { useNFT } from '../hooks/useNFT';
import { 
  ShoppingCart, 
  Check, 
  Star, 
  Lock, 
  Clock, 
  TrendingUp, 
  Users, 
  Shield,
  Gem,
  ArrowRight,
  Wallet,
  AlertCircle,
  Gift,
  Crown,
  ExternalLink,
  Loader
} from 'lucide-react';

// Constantes réseau
const BSC_MAINNET_CHAIN_ID = 56;
const BSC_MAINNET_CHAIN_ID_HEX = '0x38';

// Variables d'environnement Vite
const isDevelopment = import.meta.env.DEV;

interface NFTTier {
  id: number;
  name: string;
  icon: string;
  price: number;
  priceUSD: string;
  supply: number;
  remaining: number;
  multiplier: string;
  multiplierPercent: string;
  lockPeriods: string[];
  features: string[];
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  popular?: boolean;
  exclusive?: boolean;
  accessPlans: string[];
}

const NFTMarketplace: React.FC = () => {
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  
  // Hooks existants
  const { 
    address, 
    balance, 
    connectWallet, 
    isConnecting, 
    isConnected, 
    chainId,
    switchNetwork 
  } = useWallet();

  // Hook de fidélité
  const { 
    isFidel, 
    hasClaimedNFT, 
    actuallyOwnsNFT, 
    userInfo, 
    loading: fidelityLoading,
    inconsistencyDetected,
    error: fidelityError,
    syncStatus,
    reloadStatus,
    claimFidelityNFT: claimFromHook,
    checkEligibility,
    getStatusMessage
  } = useFidelityStatus(address);

  // Hook NFT Web3
  const {
    userNFTInfo,
    tiersInfo,
    loading: nftLoading,
    error: nftError,
    purchasing,
    loadUserNFTs,
    loadTiersInfo,
    purchaseNFT,
    claimFidelityNFT,
    canPurchaseTier,
    getNFTMultiplier,
    initialized,
    clearError,
    retry
  } = useNFT();

  // DEBUG: Afficher les infos de debug
  console.log('🔍 DEBUG Wallet & NFT Info:', {
    address,
    chainId,
    isConnected,
    balance,
    isFidel,
    hasClaimedNFT,
    userInfo,
    userNFTInfo,
    tiersInfo,
    nftError,
    initialized,
    tiersCount: Object.keys(tiersInfo).length
  });

  // Vérifier si on est sur BSC
  const isOnBSC = chainId === BSC_MAINNET_CHAIN_ID || 
                chainId === BSC_MAINNET_CHAIN_ID_HEX ||
                chainId === "56" ||
                chainId === "0x38";
  
  // Total balance USDC + USDT pour l'achat
  const totalBalance = balance.usdc + balance.usdt;

  // Charger les NFT utilisateur quand l'adresse change
  useEffect(() => {
    if (address && isConnected) {
      loadUserNFTs(address);
    }
  }, [address, isConnected, loadUserNFTs]);

  // Force le chargement si les tiers sont vides mais que tout semble OK
  useEffect(() => {
    if (isConnected && !nftLoading && Object.keys(tiersInfo).length === 0 && !nftError) {
      console.log('🔄 Force rechargement des tiers NFT...');
      loadTiersInfo();
    }
  }, [isConnected, nftLoading, tiersInfo, nftError, loadTiersInfo]);

  // Mise à jour des tiers NFT avec fallback et données du contrat
  const getNFTTiers = (): NFTTier[] => {
    const baseTiers: NFTTier[] = [
      {
        id: 1,
        name: 'NFT Bronze',
        icon: '🥉',
        price: 10,
        priceUSD: '$10',
        supply: 1000,
        remaining: 847,
        multiplier: '1.2X',
        multiplierPercent: '+20%',
        lockPeriods: ['30 jours'],
        accessPlans: ['starter'],
        features: [
          'Accès aux stratégies de base',
          'Bonus 20% sur récompenses',
          'Support communautaire',
          'Période de blocage : 30 jours'
        ],
        bgGradient: 'from-amber-600 to-amber-800',
        borderColor: 'border-amber-500',
        glowColor: 'shadow-amber-500/20'
      },
      {
        id: 2,
        name: 'NFT Argent',
        icon: '🥈',
        price: 250,
        priceUSD: '$250',
        supply: 500,
        remaining: 312,
        multiplier: '1.5X',
        multiplierPercent: '+50%',
        lockPeriods: ['30 jours', '90 jours'],
        accessPlans: ['starter', 'standard'],
        features: [
          'Accès stratégies étendues',
          'Bonus 50% sur récompenses',
          'Support prioritaire',
          'Périodes : 30-90 jours',
          'Insights trimestriels'
        ],
        bgGradient: 'from-slate-400 to-slate-600',
        borderColor: 'border-slate-400',
        glowColor: 'shadow-slate-400/20',
        popular: true
      },
      {
        id: 3,
        name: 'NFT Or',
        icon: '🥇',
        price: 500,
        priceUSD: '$500',
        supply: 200,
        remaining: 89,
        multiplier: '2.0X',
        multiplierPercent: '+100%',
        lockPeriods: ['30 jours', '90 jours', '180 jours'],
        accessPlans: ['starter', 'standard', 'premium'],
        features: [
          'Accès toutes stratégies premium',
          'Bonus 100% sur récompenses',
          'Support VIP',
          'Périodes : 30-180 jours',
          'Sessions stratégie 1-on-1',
          'Accès beta nouvelles fonctionnalités'
        ],
        bgGradient: 'from-yellow-500 to-yellow-700',
        borderColor: 'border-yellow-500',
        glowColor: 'shadow-yellow-500/30'
      },
      {
        id: 4,
        name: 'NFT Privilège',
        icon: '💎',
        price: 1000,
        priceUSD: '$1,000',
        supply: 50,
        remaining: 23,
        multiplier: '2.5X',
        multiplierPercent: '+150%',
        lockPeriods: ['30 jours', '90 jours', '180 jours', '360 jours'],
        accessPlans: ['starter', 'standard', 'premium', 'privilege'],
        features: [
          'Accès exclusif toutes stratégies',
          'Bonus 150% sur récompenses',
          'Toutes périodes disponibles',
          'Consultations stratégiques illimitées',
          'Accès anticipé nouveaux produits',
          'Participation gouvernance plateforme',
          'Événements privés',
          'Insights mensuels'
        ],
        bgGradient: 'from-purple-600 via-pink-600 to-purple-800',
        borderColor: 'border-purple-500',
        glowColor: 'shadow-purple-500/30',
        exclusive: true
      }
    ];

    // Mettre à jour avec les données du contrat si disponibles
    return baseTiers.map(tier => {
      const contractData = tiersInfo[tier.id];
      if (contractData) {
        return {
          ...tier,
          price: parseFloat(contractData.price || tier.price.toString()),
          priceUSD: `$${contractData.price || tier.price}`,
          supply: contractData.supply || tier.supply,
          remaining: contractData.remaining !== undefined ? contractData.remaining : tier.remaining
        };
      }
      return tier;
    });
  };

  const nftTiers = getNFTTiers();

  // Fonction de réclamation fidélité
  const handleFidelityClaim = async (nft: NFTTier) => {
    if (!address) {
      alert('Veuillez connecter votre wallet');
      return;
    }

    // Vérifier l'éligibilité avant de procéder
    const eligibility = checkEligibility();
    if (!eligibility.canClaim) {
      alert(eligibility.reason || 'Non éligible pour la réclamation');
      return;
    }

    try {
      console.log('🎁 Début réclamation NFT fidélité...');
      
      // Utiliser la fonction du hook qui gère tout
      const result = await claimFromHook();
      
      if (result.success) {
        console.log('✅ NFT fidélité réclamé avec succès:', result);
        
        setPurchaseSuccess(true);
        setSelectedNFT({...nft, fidelityGift: true});
        setTxHash(result.txHash || '');
        
        // Recharger les données NFT utilisateur
        if (address) {
          await loadUserNFTs(address);
          await loadTiersInfo();
        }
        
        // Redirection vers dashboard après 5 secondes
        setTimeout(() => {
          window.location.href = '/app/dashboard';
        }, 5000);
        
      } else {
        console.error('❌ Erreur réclamation:', result.error);
        alert(result.error || 'Erreur lors de la réclamation du NFT de fidélité');
      }
      
    } catch (error: any) {
      console.error('❌ Erreur réclamation fidélité:', error);
      alert(error.message || 'Erreur lors de la réclamation du NFT de fidélité');
    }
  };

  // Fonction d'achat normal
  const handlePurchase = async (nft: NFTTier) => {
    if (!isConnected) {
      alert('Veuillez connecter votre wallet');
      return;
    }
    
    if (!isOnBSC) {
      alert('Veuillez basculer sur le réseau BSC');
      await switchNetwork(56);
      return;
    }
    
    if (!canPurchaseTier(nft.id, balance.usdc)) {
      if (balance.usdc < nft.price) {
        alert('Balance USDC insuffisante');
      } else {
        alert('Ce NFT n\'est plus disponible');
      }
      return;
    }

    try {
      const result = await purchaseNFT(nft.id);
      
      if (result.success) {
        setPurchaseSuccess(true);
        setSelectedNFT(nft);
        setTxHash(result.txHash || '');
        
        // Recharger les données utilisateur
        await loadUserNFTs(address!);
        await loadTiersInfo();
        
        // Redirection vers dashboard après 5 secondes
        setTimeout(() => {
          window.location.href = '/app/dashboard';
        }, 5000);
      } else {
        alert(result.error || 'Erreur lors de l\'achat du NFT');
      }
      
    } catch (error: any) {
      console.error('Erreur achat:', error);
      alert(error.message || 'Erreur lors de l\'achat du NFT');
    }
  };

  // Fonction de connexion wallet
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Erreur connexion wallet:', error);
    }
  };

  // Composant d'erreur et de retry
  const ErrorDisplay = () => {
    if (!nftError) return null;

    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="text-red-400" size={24} />
            <div>
              <h3 className="text-red-400 font-semibold">Erreur de chargement</h3>
              <p className="text-slate-300 text-sm">{nftError}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearError}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
            >
              Ignorer
            </button>
            <button
              onClick={retry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Composant de statut de chargement amélioré
  const LoadingStatus = () => {
    if (!nftLoading) return null;

    return (
      <div className="flex justify-center items-center py-12">
        <div className="bg-slate-800 rounded-lg p-6 flex items-center space-x-4">
          <Loader size={24} className="animate-spin text-blue-400" />
          <div>
            <p className="text-white font-medium">Chargement des NFT...</p>
            <p className="text-slate-400 text-sm">
              {!initialized ? 'Initialisation du service...' : 'Récupération des données blockchain...'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Composant NFT Card avec logique fidélité et Web3
  const NFTCard: React.FC<{ nft: NFTTier }> = ({ nft }) => {
    const isPrivilegeForFidelUser = nft.name === 'NFT Privilège' && isFidel;
    
    // Nouvelle logique qui priorise la blockchain
    const reallyOwnsNFT = actuallyOwnsNFT && isPrivilegeForFidelUser;
    const userOwnsTier = userNFTInfo?.ownedTiers.includes(nft.id) || reallyOwnsNFT;
    
    // Logique pour le bouton fidélité
    const eligibility = checkEligibility();
    const showFidelityButton = isPrivilegeForFidelUser && eligibility.canClaim;
    
    // Afficher un warning si incohérence détectée
    const showInconsistencyWarning = inconsistencyDetected && isPrivilegeForFidelUser;

    return (
      <div className={`relative bg-gradient-to-br ${nft.bgGradient} p-1 rounded-2xl ${nft.glowColor} hover:shadow-2xl transition-all duration-300`}>
        
        {/* Warning d'incohérence avec bouton de synchronisation */}
        {showInconsistencyWarning && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-3 py-2 rounded text-xs flex items-center space-x-2 whitespace-nowrap">
            <AlertCircle size={12} />
            <span>Données incohérentes</span>
            <button 
              onClick={async () => {
                console.log('🔄 Synchronisation manuelle...');
                const success = await syncStatus();
                if (success) {
                  console.log('✅ Synchronisation réussie');
                }
              }}
              className="ml-1 text-yellow-200 hover:text-white bg-yellow-700 px-2 py-1 rounded text-xs"
              disabled={fidelityLoading}
            >
              {fidelityLoading ? '⏳' : '🔄 Sync'}
            </button>
          </div>
        )}

        {/* Badge Fidélité */}
        {showFidelityButton && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Crown size={14} />
            <span>Fidélité</span>
          </div>
        )}

        {/* Badge Déjà Possédé */}
        {userOwnsTier && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Check size={14} />
            <span>Possédé</span>
          </div>
        )}

        {/* Badge d'erreur */}
        {fidelityError && isPrivilegeForFidelUser && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <AlertCircle size={14} />
            <span>Erreur</span>
          </div>
        )}

        {/* Badge Populaire pour les autres */}
        {nft.popular && !isPrivilegeForFidelUser && !userOwnsTier && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            ⭐ Populaire
          </div>
        )}

        {/* Badge Exclusif */}
        {nft.exclusive && !isPrivilegeForFidelUser && !userOwnsTier && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            💎 Exclusif
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl p-6 h-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">{nft.icon}</div>
            <h3 className="text-white font-bold text-xl mb-2">{nft.name}</h3>
            
            {/* Prix avec condition fidélité */}
            <div className="flex items-center justify-center space-x-2">
              {showFidelityButton ? (
                <div className="text-center">
                  <span className="text-3xl font-bold text-green-400">GRATUIT</span>
                  <p className="text-sm text-green-300">Récompense Fidélité</p>
                </div>
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">{nft.price}</span>
                  <span className="text-slate-400">USDC</span>
                </>
              )}
            </div>
          </div>

          {/* Multiplier Highlight */}
          <div className="bg-slate-800 rounded-lg p-3 mb-4 text-center">
            <p className="text-slate-400 text-sm">Bonus Récompenses</p>
            <p className="text-2xl font-bold text-green-400">{nft.multiplier}</p>
            <p className="text-green-300 text-sm">{nft.multiplierPercent}</p>
          </div>

          {/* Supply Info */}
          <div className="flex justify-between text-sm mb-4">
            <span className="text-slate-400">Supply Total:</span>
            <span className="text-white">
              {isPrivilegeForFidelUser ? '10 (Fidélité)' : nft.supply}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-6">
            <span className="text-slate-400">Disponibles:</span>
            <span className={`font-semibold ${nft.remaining < 100 ? 'text-red-400' : 'text-green-400'}`}>
              {isPrivilegeForFidelUser ? (hasClaimedNFT ? '0' : '1') : nft.remaining}
            </span>
          </div>

          {/* Access Plans */}
          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-2">Accès aux plans :</p>
            <div className="flex flex-wrap gap-1">
              {nft.accessPlans.map((plan, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-md capitalize"
                >
                  {plan}
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-6">
            {nft.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{feature}</span>
              </div>
            ))}
            
            {/* Feature spéciale fidélité */}
            {isPrivilegeForFidelUser && (
              <div className="flex items-start space-x-2 border-t border-slate-600 pt-2 mt-4">
                <Crown size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-yellow-300 text-sm font-medium">
                  Récompense de fidélité exclusive
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {fidelityLoading || nftLoading ? (
            <button disabled className="w-full py-3 px-4 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center space-x-2">
              <Loader size={18} className="animate-spin" />
              <span>Vérification...</span>
            </button>
          ) : fidelityError && isPrivilegeForFidelUser ? (
            <div className="space-y-2">
              <button disabled className="w-full py-3 px-4 rounded-lg bg-red-700 text-red-100 flex items-center justify-center space-x-2">
                <AlertCircle size={18} />
                <span>Erreur de vérification</span>
              </button>
              <button
                onClick={reloadStatus}
                className="w-full py-2 px-4 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
              >
                Réessayer
              </button>
            </div>
          ) : userOwnsTier ? (
            <button disabled className="w-full py-3 px-4 rounded-lg bg-green-700 text-green-100 flex items-center justify-center space-x-2">
              <Check size={18} />
              <span>Déjà Possédé</span>
            </button>
          ) : showFidelityButton ? (
            <button
              onClick={() => handleFidelityClaim(nft)}
              disabled={purchasing}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              {purchasing ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <Gift size={18} />
                  <span>Réclamer Fidélité</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handlePurchase(nft)}
              disabled={!isConnected || !isOnBSC || purchasing || !canPurchaseTier(nft.id, balance.usdc)}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                !isConnected || !isOnBSC || !canPurchaseTier(nft.id, balance.usdc)
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
              }`}
            >
              {purchasing ? (
                <Loader size={18} className="animate-spin" />
              ) : !isConnected ? (
                <>
                  <Lock size={18} />
                  <span>Connecter Wallet</span>
                </>
              ) : !isOnBSC ? (
                <>
                  <AlertCircle size={18} />
                  <span>Réseau BSC Requis</span>
                </>
              ) : balance.usdc < nft.price ? (
                <>
                  <AlertCircle size={18} />
                  <span>Balance Insuffisante</span>
                </>
              ) : nft.remaining <= 0 ? (
                <>
                  <AlertCircle size={18} />
                  <span>Stock Épuisé</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  <span>Acheter Maintenant</span>
                </>
              )}
            </button>
          )}

          {/* Message de statut pour debug (optionnel) */}
          {isDevelopment && isPrivilegeForFidelUser && (
            <div className="mt-2 text-xs text-slate-500 text-center">
              {getStatusMessage()}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (purchaseSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {selectedNFT?.fidelityGift ? 'Attribution Réussie !' : 'Achat Réussi !'}
          </h1>
          <p className="text-slate-300 mb-6">
            Votre {selectedNFT?.name} a été {selectedNFT?.fidelityGift ? 'attribué' : 'livré'} dans votre wallet.
            {selectedNFT?.fidelityGift 
              ? ' Merci pour votre fidélité ! Votre NFT de récompense est maintenant actif.'
              : ' Votre achat a été confirmé et le NFT est maintenant dans votre wallet.'
            }
            Vous allez être redirigé vers la plateforme des récompenses.
          </p>
          
          {/* Lien vers la transaction */}
          {txHash && (
            <div className="mb-4">
              <a 
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <ExternalLink size={16} />
                <span>Voir la transaction</span>
              </a>
            </div>
          )}
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">NFT {selectedNFT?.fidelityGift ? 'Attribué' : 'Acquis'}</p>
            <p className="text-lg font-semibold text-white">{selectedNFT?.name}</p>
            <p className="text-blue-400">Bonus: {selectedNFT?.multiplier}</p>
            {selectedNFT?.fidelityGift && (
              <p className="text-yellow-400 text-sm">🎁 Récompense de Fidélité</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-12 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="text-blue-400" size={24} />
              <span className="text-blue-400 font-medium">Collection Exclusive</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Collection NFT
              </span>
              <br />
              Accès à la Plateforme
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Choisissez votre niveau d'accès et débloquez des bonus exclusifs sur vos récompenses.
            </p>

            {/* Bouton de rechargement manuel */}
            <div className="mt-6">
              <button
                onClick={() => {
                  console.log('🔄 Rechargement manuel des NFT...');
                  loadTiersInfo();
                  if (address) loadUserNFTs(address);
                }}
                disabled={nftLoading}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {nftLoading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Clock size={18} />
                )}
                <span>Actualiser les NFT</span>
              </button>
            </div>
            
            {/* Affichage info utilisateur connecté */}
            {isConnected && userNFTInfo && userNFTInfo.highestTier > 0 && (
              <div className="mt-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Gem className="text-green-400" size={20} />
                  <span className="text-green-400 font-semibold">NFT Actif</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Tier {userNFTInfo.highestTier} • Multiplicateur: {getNFTMultiplier()}x
                </p>
              </div>
            )}
            
            {/* Affichage info utilisateur fidèle */}
            {isFidel && userInfo && !actuallyOwnsNFT && (
              <div className="mt-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Crown className="text-yellow-400" size={20} />
                  <span className="text-yellow-400 font-semibold">Membre Fidèle</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Bonjour {userInfo.firstName} ! {checkEligibility().canClaim 
                    ? 'Vous êtes éligible pour un NFT Privilège gratuit.'
                    : getStatusMessage()
                  }
                </p>
                
                {/* Bouton de synchronisation si incohérence */}
                {inconsistencyDetected && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={syncStatus}
                      disabled={fidelityLoading}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
                    >
                      {fidelityLoading ? 'Synchronisation...' : 'Corriger les données'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wallet Status */}
      <section className="py-8 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          {!isConnected ? (
            <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 text-center">
              <Wallet className="mx-auto mb-4 text-blue-400" size={48} />
              <h3 className="text-white font-semibold text-lg mb-2">Connectez Votre Wallet</h3>
              <p className="text-slate-400 mb-4">Connectez votre wallet Metamask pour acheter un NFT d'accès</p>
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Connexion...</span>
                  </>
                ) : (
                  <span>Connecter Metamask</span>
                )}
              </button>
            </div>
          ) : !isOnBSC ? (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="text-yellow-400" size={20} />
                  <span className="text-white font-medium">Réseau Incorrect</span>
                </div>
                <button
                  onClick={() => switchNetwork(56)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Basculer sur BSC
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white font-medium">Wallet Connecté</span>
                  <span className="text-slate-400 text-sm">({address?.slice(0, 6)}...{address?.slice(-4)})</span>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Balance USDC</p>
                  <p className="text-white font-semibold">
                    {balance.usdc.toFixed(2)} USDC
                  </p>
                  {userNFTInfo && userNFTInfo.highestTier > 0 && (
                    <p className="text-green-400 text-sm">
                      Bonus: {((getNFTMultiplier() - 1) * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Affichage des erreurs */}
      <ErrorDisplay />

      {/* NFT Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Statut de chargement */}
          <LoadingStatus />

          {/* Debug info pour développement */}
          {isDevelopment && (
            <div className="mb-8 bg-slate-800 rounded-lg p-4">
              <h3 className="text-white font-bold mb-2">🔧 Debug Info</h3>
              <div className="text-sm text-slate-300 space-y-1">
                <p>Tiers chargés: {Object.keys(tiersInfo).length}</p>
                <p>Service initialisé: {initialized.toString()}</p>
                <p>En chargement: {nftLoading.toString()}</p>
                <p>Erreur: {nftError || 'Aucune'}</p>
                <p>Wallet connecté: {isConnected.toString()}</p>
                <p>Réseau correct: {isOnBSC.toString()}</p>
                <p>Mode: {import.meta.env.MODE}</p>
                <p>API URL: {import.meta.env.VITE_API_URL}</p>
                <p>Contract: {import.meta.env.VITE_NFT_CONTRACT_ADDRESS}</p>
                <p>Tiers disponibles: {Object.keys(tiersInfo).join(', ') || 'Aucun'}</p>
              </div>
            </div>
          )}

          {/* Grille des NFT */}
          {!nftLoading && Object.keys(tiersInfo).length === 0 && !nftError ? (
            <div className="text-center py-12">
              <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
                <AlertCircle className="mx-auto mb-4 text-yellow-400" size={48} />
                <h3 className="text-white font-semibold text-lg mb-2">Aucun NFT trouvé</h3>
                <p className="text-slate-400 mb-4">
                  Les NFT ne se chargent pas. Cela peut être dû à un problème de connexion blockchain.
                </p>
                <button
                  onClick={() => {
                    console.log('🔄 Retry chargement NFT...');
                    loadTiersInfo();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : !nftLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {nftTiers.map((nft) => {
                console.log(`🔍 Rendu NFT ${nft.name}:`, {
                  id: nft.id,
                  price: nft.price,
                  remaining: nft.remaining,
                  userConnected: isConnected
                });
                return <NFTCard key={nft.id} nft={nft} />;
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* Comparaison Table */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Comparatif des NFT</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left p-4 text-white font-semibold">Caractéristiques</th>
                  <th className="text-center p-4 text-white font-semibold">🥉 Bronze</th>
                  <th className="text-center p-4 text-white font-semibold">🥈 Argent</th>
                  <th className="text-center p-4 text-white font-semibold">🥇 Or</th>
                  <th className="text-center p-4 text-white font-semibold">💎 Privilège</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Prix</td>
                  <td className="p-4 text-center">{nftTiers[0].price} USDC</td>
                  <td className="p-4 text-center">{nftTiers[1].price} USDC</td>
                  <td className="p-4 text-center">{nftTiers[2].price} USDC</td>
                  <td className="p-4 text-center">{nftTiers[3].price} USDC</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Bonus Récompenses</td>
                  <td className="p-4 text-center text-green-400">+20%</td>
                  <td className="p-4 text-center text-green-400">+50%</td>
                  <td className="p-4 text-center text-green-400">+100%</td>
                  <td className="p-4 text-center text-green-400">+150%</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Accès Plans</td>
                  <td className="p-4 text-center">Starter</td>
                  <td className="p-4 text-center">Starter + Standard</td>
                  <td className="p-4 text-center">Starter + Standard + Premium</td>
                  <td className="p-4 text-center">Tous les plans</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Périodes de Blocage</td>
                  <td className="p-4 text-center">30j</td>
                  <td className="p-4 text-center">30-90j</td>
                  <td className="p-4 text-center">30-180j</td>
                  <td className="p-4 text-center">30-360j</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Support</td>
                  <td className="p-4 text-center">Communautaire</td>
                  <td className="p-4 text-center">Prioritaire</td>
                  <td className="p-4 text-center">VIP</td>
                  <td className="p-4 text-center">Dédié</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Sessions 1-on-1</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                  <td className="p-4 text-center">✅ Illimité</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Gouvernance</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Supply Restant</td>
                  <td className="p-4 text-center text-green-400">{nftTiers[0].remaining}</td>
                  <td className="p-4 text-center text-green-400">{nftTiers[1].remaining}</td>
                  <td className="p-4 text-center text-green-400">{nftTiers[2].remaining}</td>
                  <td className="p-4 text-center text-green-400">{nftTiers[3].remaining}</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Fidélité</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">
                    <span className="text-yellow-400 font-semibold">🎁 GRATUIT</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Avantages des NFT d'Accès</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Bonus Automatiques</h3>
              <p className="text-slate-400">
                Vos bonus NFT s'appliquent automatiquement à tous vos récompenses futurs. 
                Plus votre NFT est rare, plus vos récompenses sont importantes.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Accès Permanent</h3>
              <p className="text-slate-400">
                Une fois acquis, votre NFT vous donne un accès permanent à la plateforme et aux plans correspondants. 
                Aucune date d'expiration.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Communauté Exclusive</h3>
              <p className="text-slate-400">
                Rejoignez une communauté de partage de stratégies privée avec accès à des insights, 
                des stratégies avancées et un support personnalisé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Questions Fréquentes</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Comment acheter un NFT avec Metamask ?</h3>
              <p className="text-slate-400">
                Connectez votre wallet Metamask, assurez-vous d'être sur le réseau BSC, et d'avoir suffisamment d'USDC. 
                Cliquez sur "Acheter Maintenant" et confirmez la transaction dans Metamask.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Qu'est-ce que le système de fidélité ?</h3>
              <p className="text-slate-400">
                Les membres fidèles pré-sélectionnés peuvent recevoir un NFT Privilège gratuitement. 
                Cette récompense reconnaît votre soutien au projet depuis ses débuts.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Puis-je upgrader mon NFT plus tard ?</h3>
              <p className="text-slate-400">
                Oui, vous pouvez acheter un NFT de niveau supérieur à tout moment. Votre ancien NFT reste dans votre wallet 
                et seul le NFT de plus haut niveau sera pris en compte pour les bonus.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Comment sont appliqués les bonus ?</h3>
              <p className="text-slate-400">
                Les bonus NFT s'appliquent automatiquement sur toutes vos récompenses. 
                Le système détecte votre NFT le plus élevé et applique le multiplicateur correspondant.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Que se passe-t-il après l'achat ?</h3>
              <p className="text-slate-400">
                Le NFT est immédiatement transféré dans votre wallet Metamask. Vous pouvez ensuite 
                accéder aux plans de récompense correspondants où vos bonus seront automatiquement appliqués.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 px-4 bg-slate-900 border-t border-slate-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Prêt à Rejoindre l'Aventure ?</h2>
          <p className="text-slate-400 mb-6">
            {isFidel 
              ? `${userInfo?.firstName}, réclamez votre NFT de fidélité ou explorez nos autres options.`
              : "Choisissez votre NFT et commencez à profiter des plans de récompenses exclusives."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium px-6 py-3 border border-blue-500/30 rounded-lg hover:bg-blue-900/20 transition-colors"
            >
              <ArrowRight size={18} />
              <span>Retour à l'Accueil</span>
            </Link>
            
            {isConnected && isOnBSC && (
              <button
                onClick={() => {
                  loadTiersInfo();
                  if (address) loadUserNFTs(address);
                }}
                className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-300 font-medium px-6 py-3 border border-slate-500/30 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <Clock size={18} />
                <span>Actualiser</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer avec disclaimers */}
      <footer className="py-8 px-4 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="text-blue-400" size={20} />
              <span className="text-blue-400 font-semibold">CryptoVault NFT Collection</span>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-6">
            <p className="text-slate-500 text-xs text-center leading-relaxed">
              © 2024 CryptoVault. Cette plateforme est réservée aux membres autorisés. 
              Les NFT représentent des droits d'accès et ne constituent pas des instruments financiers. 
              Tous les accès aux stratégies de récompense comportent des risques. Les performances passées ne garantissent pas les résultats futurs. 
              Les bonus et récompenses dépendent des performances réelles des stratégies de récompenses et ne sont pas garantis.
              Smart contracts déployés sur Binance Smart Chain (BSC). Paiements en USDC uniquement.
              Veuillez consulter nos conditions d'utilisation et effectuer vos propres recherches avant de vous lancer dans les startégies de récompenses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NFTMarketplace;