import React from 'react';
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

  // Vérifier si c'est le NFT Privilège ET si l'user est fidèle
  const isPrivilegeForFidelUser = nft.name === 'NFT Privilège' && isFidel;
  const showFidelityButton = isPrivilegeForFidelUser && !hasClaimedNFT;
  const showPurchaseButton = !isPrivilegeForFidelUser || hasClaimedNFT;
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

console.log('🔍 DEBUG canPurchaseTier détaillé:', {
  tier: nft.id,
  balance: balance?.usdc,
  resultat: canPurchaseTier(nft.id, balance?.usdc || 0),
  // Si possible, vérifiez les conditions internes
  tierInfo: tiersInfo ? tiersInfo[nft.id] : null,
  tierActive: tiersInfo && tiersInfo[nft.id] ? tiersInfo[nft.id].active : false,
  tierRemaining: tiersInfo && tiersInfo[nft.id] ? tiersInfo[nft.id].remaining : 0
});

  return (
    <div className={`relative bg-gradient-to-br ${nft.bgGradient} p-1 rounded-2xl ${nft.glowColor} hover:shadow-2xl transition-all duration-300`}>
      {/* Badge Fidélité pour Privilège */}
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

      {/* Popularité pour les autres */}
      {nft.popular && !isPrivilegeForFidelUser && (
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

        {/* Supply Info avec condition fidélité */}
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
          {nft.features.map((feature, index) => (
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

        {showPurchaseButton && (
          <button onClick={() => onPurchase(nft)}>
            Acheter
          </button>
        )}

        {/* Action Button */}
        {fidelityLoading ? (
          <button disabled className="w-full py-3 px-4 rounded-lg bg-slate-700 text-slate-400">
            Vérification...
          </button>
        ) : showFidelityButton ? (
          <button
            onClick={handleFidelityClaim}
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