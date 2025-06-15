import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useFidelityStatus } from '../hooks/useFidelityStatus';
import FidelityService from '../services/FidelityService';
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
  Crown
} from 'lucide-react';

// Constantes réseau
const BSC_MAINNET_CHAIN_ID = 56;
const BSC_MAINNET_CHAIN_ID_HEX = '0x38';

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
}

const NFTMarketplace: React.FC = () => {
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
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

  // Nouveau hook de fidélité
  const { isFidel, hasClaimedNFT, userInfo, loading: fidelityLoading } = useFidelityStatus(address);

  // DEBUG: Afficher les infos de debug
  console.log('🔍 DEBUG Wallet Info:', {
    address,
    chainId,
    isConnected,
    balance,
    isFidel,
    hasClaimedNFT,
    userInfo
  });

  // Vérifier si on est sur BSC - Support tous les formats
  const isOnBSC = chainId === BSC_MAINNET_CHAIN_ID || 
                  chainId === BSC_MAINNET_CHAIN_ID_HEX || 
                  chainId === "56" || 
                  chainId === "0x38";
  
  // Total balance USDC + USDT pour l'achat
  const totalBalance = balance.usdc + balance.usdt;

  // Force refresh chainId au chargement de la page
  useEffect(() => {
    const forceChainIdCheck = async () => {
      if (window.ethereum && isConnected) {
        try {
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const numericChainId = parseInt(currentChainId, 16);
          console.log('🔄 Force chainId check:', {
            currentChainId,
            numericChainId,
            contextChainId: chainId
          });
        } catch (error) {
          console.error('Erreur vérification chainId:', error);
        }
      }
    };

    forceChainIdCheck();
  }, [isConnected, chainId]);

  const nftTiers: NFTTier[] = [
    {
      id: 1,
      name: 'NFT Bronze',
      icon: '🥉',
      price: 1,
      priceUSD: '$1',
      supply: 1000,
      remaining: 847,
      multiplier: '1.2X',
      multiplierPercent: '+20%',
      lockPeriods: ['30 jours'],
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
      features: [
        'Accès stratégies étendues',
        'Bonus 50% sur récompenses',
        'Support prioritaire',
        'Périodes : 30-90 jours',
        'Insights hebdomadaires'
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
      features: [
        'Accès toutes stratégies premium',
        'Bonus 100% sur récompenses',
        'Support VIP 24/7',
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
      features: [
        'Accès exclusif toutes stratégies',
        'Bonus 150% sur récompenses',
        'Gestionnaire de compte dédié',
        'Toutes périodes disponibles',
        'Consultations stratégiques illimitées',
        'Accès anticipé nouveaux produits',
        'Participation gouvernance plateforme',
        'Événements privés'
      ],
      bgGradient: 'from-purple-600 via-pink-600 to-purple-800',
      borderColor: 'border-purple-500',
      glowColor: 'shadow-purple-500/30',
      exclusive: true
    }
  ];

  // Fonction de réclamation fidélité
  const handleFidelityClaim = async (nft: NFTTier) => {
    if (!address) return;

    setLoading(true);
    try {
      // TODO: Intégrer avec votre smart contract NFT
      console.log('Attribution fidélité NFT:', nft.name, 'pour', address);
      
      // Simuler l'appel smart contract
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Marquer comme réclamé en base
      await FidelityService.claimFidelityNFT(address);

      setPurchaseSuccess(true);
      setSelectedNFT({...nft, fidelityGift: true});
      
      // Redirection vers dashboard après 3 secondes
      setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur attribution fidélité:', error);
      alert(error.message || 'Erreur lors de l\'attribution du NFT de fidélité');
    } finally {
      setLoading(false);
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
    
    if (totalBalance > nft.price) {
      alert('Balance insuffisante');
      return;
    }

    setLoading(true);
    try {
      // TODO: Intégrer avec votre smart contract NFT
      console.log('Achat NFT:', nft.name, 'pour', address);
      
      // Simuler l'achat pour l'instant
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPurchaseSuccess(true);
      setSelectedNFT(nft);
      
      // Redirection vers dashboard après 3 secondes
      setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 3000);
      
    } catch (error) {
      console.error('Erreur achat:', error);
      alert('Erreur lors de l\'achat du NFT');
    } finally {
      setLoading(false);
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

  // Composant NFT Card avec logique fidélité
  const NFTCard: React.FC<{ nft: NFTTier }> = ({ nft }) => {
    const isPrivilegeForFidelUser = nft.name === 'NFT Privilège' && isFidel;
    const showFidelityButton = isPrivilegeForFidelUser && !hasClaimedNFT;
    const showPurchaseButton = !isPrivilegeForFidelUser || hasClaimedNFT;

    return (
      <div className={`relative bg-gradient-to-br ${nft.bgGradient} p-1 rounded-2xl ${nft.glowColor} hover:shadow-2xl transition-all duration-300`}>
        {/* Badge Fidélité */}
        {isPrivilegeForFidelUser && !hasClaimedNFT && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Crown size={14} />
            <span>Fidélité</span>
          </div>
        )}

        {/* Badge Déjà Réclamé */}
        {isPrivilegeForFidelUser && hasClaimedNFT && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Check size={14} />
            <span>Réclamé</span>
          </div>
        )}

        {/* Badge Populaire pour les autres */}
        {nft.popular && !isPrivilegeForFidelUser && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            ⭐ Populaire
          </div>
        )}

        {/* Badge Exclusif */}
        {nft.exclusive && !isPrivilegeForFidelUser && (
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
          {fidelityLoading ? (
            <button disabled className="w-full py-3 px-4 rounded-lg bg-slate-700 text-slate-400">
              Vérification...
            </button>
          ) : showFidelityButton ? (
            <button
              onClick={() => handleFidelityClaim(nft)}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Gift size={18} />
                  <span>Réclamer Fidélité</span>
                </>
              )}
            </button>
          ) : hasClaimedNFT && isPrivilegeForFidelUser ? (
            <button disabled className="w-full py-3 px-4 rounded-lg bg-green-700 text-green-100 flex items-center justify-center space-x-2">
              <Check size={18} />
              <span>Déjà Réclamé</span>
            </button>
          ) : (
            <button
              onClick={() => handlePurchase(nft)}
              disabled={!isConnected || !isOnBSC || loading || totalBalance < nft.price}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                !isConnected || !isOnBSC || totalBalance < nft.price
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
              ) : totalBalance < nft.price ? (
                <>
                  <AlertCircle size={18} />
                  <span>Balance Insuffisante</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  <span>Acheter Maintenant</span>
                </>
              )}
            </button>
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
            Vous allez être redirigé vers la plateforme d'investissement.
          </p>
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
              Choisissez votre niveau d'accès et débloquez des bonus exclusifs sur vos récompenses d'investissement.
            </p>
            
            {/* Affichage info utilisateur fidèle */}
            {isFidel && userInfo && (
              <div className="mt-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Crown className="text-yellow-400" size={20} />
                  <span className="text-yellow-400 font-semibold">Membre Fidèle</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Bonjour {userInfo.firstName} ! Vous êtes éligible pour un NFT Privilège gratuit.
                </p>
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Connexion...' : 'Connecter Metamask'}
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
                  <p className="text-slate-400 text-sm">Balance Totale</p>
                  <p className="text-white font-semibold">
                    {balance.usdc.toFixed(2)} USDC + {balance.usdt.toFixed(2)} USDT
                  </p>
                  <p className="text-green-400 text-sm">
                    Total: {totalBalance.toFixed(2)} USD
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NFT Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {nftTiers.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
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
                  <td className="p-4 text-center">120 USDC</td>
                  <td className="p-4 text-center">250 USDC</td>
                  <td className="p-4 text-center">500 USDC</td>
                  <td className="p-4 text-center">1,000 USDC</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Bonus Récompenses</td>
                  <td className="p-4 text-center text-green-400">+20%</td>
                  <td className="p-4 text-center text-green-400">+50%</td>
                  <td className="p-4 text-center text-green-400">+100%</td>
                  <td className="p-4 text-center text-green-400">+150%</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Périodes de Blocage</td>
                  <td className="p-4 text-center">30j</td>
                  <td className="p-4 text-center">30-90j</td>
                  <td className="p-4 text-center">30-180j</td>
                  <td className="p-4 text-center">30-360j</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Support</td>
                  <td className="p-4 text-center">Communautaire</td>
                  <td className="p-4 text-center">Prioritaire</td>
                  <td className="p-4 text-center">VIP 24/7</td>
                  <td className="p-4 text-center">Dédié</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="p-4 font-medium">Sessions 1-on-1</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                  <td className="p-4 text-center">✅ Illimité</td>
                </tr>
                <tr className="border-t border-slate-600 bg-slate-750">
                  <td className="p-4 font-medium">Gouvernance</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
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

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Questions Fréquentes</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Comment fonctionne le système de bonus NFT ?</h3>
              <p className="text-slate-400">
                Chaque NFT applique un multiplicateur sur les récompenses que vous gagnez via les stratégies d'investissement. 
                Plus votre NFT est rare, plus le bonus est élevé. Les bonus s'appliquent sur tous vos investissements futurs.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Qu'est-ce que le système de fidélité ?</h3>
              <p className="text-slate-400">
                Les membres fidèles qui ont soutenu le projet depuis le début peuvent recevoir un NFT Privilège gratuit. 
                Cette récompense est limitée à un nombre restreint de membres pré-sélectionnés.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Puis-je upgrader mon NFT plus tard ?</h3>
              <p className="text-slate-400">
                Oui, vous pouvez acheter un NFT de niveau supérieur à tout moment. Votre ancien NFT reste dans votre wallet 
                et peut être vendu sur le marché secondaire. Seul le NFT de plus haut niveau sera pris en compte pour les bonus.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Les NFT ont-ils une durée de validité ?</h3>
              <p className="text-slate-400">
                Non, les NFT n'expirent jamais. Une fois acquis, vous gardez l'accès à la plateforme et aux bonus 
                tant que vous possédez le NFT dans votre wallet. C'est un actif permanent.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-2">Que se passe-t-il après l'achat ?</h3>
              <p className="text-slate-400">
                Après l'achat, le NFT est immédiatement transféré dans votre wallet Metamask. Vous pouvez ensuite 
                accéder à la plateforme d'investissement où vos bonus seront automatiquement appliqués à tous vos dépôts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Informations Importantes */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Informations Importantes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avertissement Investissement */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="text-red-400 font-semibold mb-2">Avertissement sur les Risques</h3>
                  <ul className="text-red-300 text-sm space-y-1">
                    <li>• Les investissements crypto comportent des risques de perte</li>
                    <li>• Aucun rendement n'est garanti</li>
                    <li>• Les performances passées ne préjugent pas des résultats futurs</li>
                    <li>• Ne jamais investir plus que ce que vous pouvez vous permettre de perdre</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Info NFT */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Gem className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="text-blue-400 font-semibold mb-2">À propos des NFT</h3>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Les NFT représentent des droits d'accès à la plateforme</li>
                    <li>• Ils ne constituent pas des titres financiers</li>
                    <li>• Les bonus dépendent des performances réelles</li>
                    <li>• Propriété permanente sans date d'expiration</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Info Technique */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Shield className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="text-green-400 font-semibold mb-2">Sécurité & Technique</h3>
                  <ul className="text-green-300 text-sm space-y-1">
                    <li>• Smart contracts audités et sécurisés</li>
                    <li>• Blockchain BSC (Binance Smart Chain)</li>
                    <li>• Transactions transparentes et vérifiables</li>
                    <li>• Support wallet Metamask requis</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Info Communauté */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Users className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="text-purple-400 font-semibold mb-2">Communauté Privée</h3>
                  <ul className="text-purple-300 text-sm space-y-1">
                    <li>• Accès exclusif aux membres autorisés</li>
                    <li>• Vérification préalable requise</li>
                    <li>• Support et accompagnement personnalisé</li>
                    <li>• Évènements et contenus exclusifs</li>
                  </ul>
                </div>
              </div>
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
              : "Choisissez votre NFT et commencez à profiter des opportunités d'investissement exclusives."
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
                onClick={() => window.location.reload()}
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
              Tous les investissements comportent des risques. Les performances passées ne garantissent pas les résultats futurs. 
              Les bonus et récompenses dépendent des performances réelles des stratégies d'investissement et ne sont pas garantis.
              Veuillez consulter nos conditions d'utilisation et effectuer vos propres recherches avant tout investissement.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NFTMarketplace;