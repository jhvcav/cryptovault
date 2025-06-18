// src/pages/NFTCards.tsx
import React, { useEffect } from 'react';
import { Gift, ShoppingCart, Check, AlertCircle, Crown, Loader } from 'lucide-react';
import { useFidelityStatus } from '../hooks/useFidelityStatus';
import { useWallet } from '../contexts/WalletContext';
import { useNFT } from '../hooks/useNFT';
import FidelityService from '../services/FidelityService';

const NFTCard = ({ nft, onPurchase, onFidelityClaim, loading }: {
  nft: any;
  onPurchase: (nft: any) => void;
  onFidelityClaim: (nft: any) => void;
  loading: boolean;
}) => {
  console.log('🔍 NFTCard START pour:', nft.name);
  const { address, isConnected, balance, chainId } = useWallet();
  console.log('🔍 NFTCard hooks 1 OK');
  const { isFidel, hasClaimedNFT, loading: fidelityLoading } = useFidelityStatus(address);
  console.log('🔍 NFTCard hooks 2 OK');
  const { userNFTInfo, canPurchaseTier, purchasing } = useNFT();
  console.log('🔍 NFTCard hooks 3 OK');

  // Ajoutez ces logs temporaires dans votre NFTCard, après les hooks
useEffect(() => {
  if (nft.name === 'NFT Fidélité') {
    console.log('🎁 DEBUG NFT Fidélité détaillé:', {
      nftName: nft.name,
      nftId: nft.id,
      isFidel,
      hasClaimedNFT,
      address,
      fidelityLoading,
      userInfo,
      // Conditions calculées
      isFidelityForFidelUser: nft.name === 'NFT Fidélité' && isFidel,
      showFidelityButton: (nft.name === 'NFT Fidélité' && isFidel) && !hasClaimedNFT,
      fidelityReserved: nft.name === 'NFT Fidélité' && !isFidel,
      // Status du hook
      hookStatus: {
        isFidel,
        hasClaimedNFT,
        loading: fidelityLoading
      }
    });
  }
}, [nft.name, nft.id, isFidel, hasClaimedNFT, address, fidelityLoading]);


  // 🔧 CORRECTION: Vérifier si c'est le NFT Fidélité ET si l'user est fidèle
  const isFidelityForFidelUser = nft.name === 'NFT Fidélité' && isFidel;
  const showFidelityButton = isFidelityForFidelUser && !hasClaimedNFT;
  const showPurchaseButton = !isFidelityForFidelUser || hasClaimedNFT;
  const fidelityReserved = nft.name === 'NFT Fidélité' && !isFidel;
  
  const isOnBSC = chainId === 56 || chainId === 0x38;

  // Vérifier si l'utilisateur possède déjà ce tier
  const userOwnsTier = userNFTInfo?.ownedTiers.includes(nft.id) || false;

  
  if (nft.id === 1) {
    console.log('🔍 DEBUG Conditions bouton Bronze:', {
      isConnected: isConnected,
      isOnBSC: isOnBSC,
      purchasing: purchasing,
      balanceUsdc: balance?.usdc,
      nftPrice: nft.price,
      canPurchaseTier: canPurchaseTier(nft.id, balance?.usdc || 0),
      
      // Conditions individuelles
      condition1_connected: !isConnected,
      condition2_network: !isOnBSC,
      condition3_purchasing: purchasing,
      condition4_canPurchase: !canPurchaseTier(nft.id, balance?.usdc || 0),
      
      // Condition finale
      finalDisabled: !isConnected || !isOnBSC || purchasing || !canPurchaseTier(nft.id, balance?.usdc || 0)
    });
  }

  const handleFidelityClaim = async () => {
    try {
      await onFidelityClaim(nft);
      // Marquer comme réclamé en base
      await FidelityService.claimFidelityNFT(address);
    } catch (error) {
      console.error('Erreur réclamation fidélité:', error);
    }
  };

  return (
    <div className={`relative bg-gradient-to-br ${nft.bgGradient} p-1 rounded-2xl ${nft.glowColor} hover:shadow-2xl transition-all duration-300`}>
      {/* 🔧 CORRECTION: Badge Fidélité pour NFT Fidélité */}
      {isFidelityForFidelUser && !hasClaimedNFT && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
          <Crown size={14} />
          <span>Fidélité 🎁</span>
        </div>
      )}

      {/* Badge Déjà Réclamé */}
      {isFidelityForFidelUser && hasClaimedNFT && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
          <Check size={14} />
          <span>Réclamé</span>
        </div>
      )}

      {/* Badge Réservé pour NFT Fidélité */}
      {fidelityReserved && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
          <AlertCircle size={14} />
          <span>Réservé Fidèles</span>
        </div>
      )}

      {/* Popularité pour les autres NFT */}
      {nft.popular && !isFidelityForFidelUser && !fidelityReserved && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          ⭐ Populaire
        </div>
      )}

      {/* Card Content */}
      <div className="bg-slate-900 rounded-2xl p-6 h-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{nft.icon}</div>
          <h3 className="text-white font-bold text-xl mb-2">{nft.name}</h3>
          
          {/* 🔧 CORRECTION: Prix avec condition fidélité pour NFT Fidélité */}
          <div className="flex items-center justify-center space-x-2">
            {showFidelityButton ? (
              <div className="text-center">
                <span className="text-3xl font-bold text-emerald-400">GRATUIT</span>
                <p className="text-sm text-emerald-300">Récompense Fidélité</p>
              </div>
            ) : fidelityReserved ? (
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-500">RÉSERVÉ</span>
                <p className="text-sm text-slate-400">Membres Fidèles</p>
              </div>
            ) : (
              <>
                <span className="text-3xl font-bold text-white">{nft.price}</span>
                <span className="text-slate-400">{nft.price > 0 ? 'USDC' : ''}</span>
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

        {/* 🔧 CORRECTION: Supply Info avec condition fidélité pour NFT Fidélité */}
        <div className="flex justify-between text-sm mb-4">
          <span className="text-slate-400">Supply Total:</span>
          <span className="text-white">
            {isFidelityForFidelUser ? `${nft.supply} (Fidélité)` : nft.supply}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-6">
          <span className="text-slate-400">Disponibles:</span>
          <span className={`font-semibold ${nft.remaining < 100 ? 'text-red-400' : 'text-green-400'}`}>
            {isFidelityForFidelUser ? (hasClaimedNFT ? '0' : '1') : nft.remaining}
          </span>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {nft.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
          
          {/* 🔧 CORRECTION: Feature spéciale fidélité pour NFT Fidélité */}
          {isFidelityForFidelUser && (
            <div className="flex items-start space-x-2 border-t border-slate-600 pt-2 mt-4">
              <Crown size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-yellow-300 text-sm font-medium">
                NFT Fidélité - Récompense exclusive
              </span>
            </div>
          )}
        </div>

        {/* 🔧 CORRECTION: Action Button adapté pour NFT Fidélité */}
        {fidelityLoading ? (
          <button disabled className="w-full py-3 px-4 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center space-x-2">
            <Loader size={18} className="animate-spin" />
            <span>Vérification...</span>
          </button>
        ) : showFidelityButton ? (
          <button
            onClick={handleFidelityClaim}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Gift size={18} />
                <span>Réclamer NFT Fidélité</span>
              </>
            )}
          </button>
        ) : hasClaimedNFT && isFidelityForFidelUser ? (
          <button disabled className="w-full py-3 px-4 rounded-lg bg-green-700 text-green-100 flex items-center justify-center space-x-2">
            <Check size={18} />
            <span>NFT Fidélité Réclamé</span>
          </button>
        ) : fidelityReserved ? (
          <button disabled className="w-full py-3 px-4 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center space-x-2">
            <AlertCircle size={18} />
            <span>Réservé Membres Fidèles</span>
          </button>
        ) : userOwnsTier ? (
          <button disabled className="w-full py-3 px-4 rounded-lg bg-green-700 text-green-100 flex items-center justify-center space-x-2">
            <Check size={18} />
            <span>Déjà Possédé</span>
          </button>
        ) : (
          <button
            onClick={() => onPurchase(nft)}
            disabled={!isConnected || !isOnBSC || loading || !canPurchaseTier(nft.id, balance?.usdc || 0)}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              !isConnected || !isOnBSC || !canPurchaseTier(nft.id, balance?.usdc || 0)
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
            }`}
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : !isConnected ? (
              <>
                <AlertCircle size={18} />
                <span>Connecter Wallet</span>
              </>
            ) : !isOnBSC ? (
              <>
                <AlertCircle size={18} />
                <span>Réseau BSC Requis</span>
              </>
            ) : (balance?.usdc || 0) < nft.price ? (
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
      </div>
    </div>
  );
};

export default NFTCard;