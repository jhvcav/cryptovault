// hooks/useNFT.ts
import { useState, useEffect, useCallback } from 'react';
import nftService, { TierInfo, UserNFTInfo } from '../services/NFTService';

interface UseNFTReturn {
  // État
  userNFTInfo: UserNFTInfo | null;
  tiersInfo: Record<number, TierInfo>;
  loading: boolean;
  error: string | null;
  purchasing: boolean;
  
  // Actions
  loadUserNFTs: (address: string) => Promise<void>;
  loadTiersInfo: () => Promise<void>;
  purchaseNFT: (tier: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  claimFidelityNFT: (address: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  
  // Utilitaires
  hasAccessToPlans: (plans: string[]) => boolean;
  getNFTMultiplier: () => number;
  canPurchaseTier: (tier: number, usdcBalance: number) => boolean;
}

export const useNFT = (): UseNFTReturn => {
  const [userNFTInfo, setUserNFTInfo] = useState<UserNFTInfo | null>(null);
  const [tiersInfo, setTiersInfo] = useState<Record<number, TierInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Charger les infos des tiers
  const loadTiersInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tiers: Record<number, TierInfo> = {};
      
      for (let tier = 1; tier <= 4; tier++) {
        const tierInfo = await nftService.getTierInfo(tier);
        const remaining = await nftService.getRemainingSupply(tier);
        
        tiers[tier] = {
          ...tierInfo,
          remaining
        };
      }
      
      setTiersInfo(tiers);
    } catch (err: any) {
      console.error('Erreur chargement tiers:', err);
      setError(err.message || 'Erreur lors du chargement des informations des NFT');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les NFT de l'utilisateur
  const loadUserNFTs = useCallback(async (address: string) => {
    if (!address) {
      setUserNFTInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const nftInfo = await nftService.getUserNFTInfo(address);
      setUserNFTInfo(nftInfo);
    } catch (err: any) {
      console.error('Erreur chargement NFT utilisateur:', err);
      setError(err.message || 'Erreur lors du chargement des NFT utilisateur');
      setUserNFTInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Acheter un NFT
  const purchaseNFT = useCallback(async (tier: number): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setPurchasing(true);
      setError(null);
      
      console.log(`🛒 Achat NFT Tier ${tier} en cours...`);
      
      const txHash = await nftService.purchaseNFT(tier);
      
      console.log('✅ Transaction envoyée:', txHash);
      
      // Attendre la confirmation (optionnel)
      // Vous pouvez ajouter une logique d'attente de confirmation ici
      
      return { success: true, txHash };
      
    } catch (err: any) {
      console.error('❌ Erreur achat NFT:', err);
      const errorMessage = err.message || 'Erreur lors de l\'achat du NFT';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setPurchasing(false);
    }
  }, []);

  // Réclamer un NFT de fidélité
  const claimFidelityNFT = useCallback(async (address: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setPurchasing(true);
      setError(null);
      
      console.log(`🎁 Réclamation NFT fidélité pour ${address}...`);
      
      const txHash = await nftService.claimFidelityNFT(address);
      
      console.log('✅ NFT fidélité réclamé:', txHash);
      
      return { success: true, txHash };
      
    } catch (err: any) {
      console.error('❌ Erreur réclamation NFT fidélité:', err);
      const errorMessage = err.message || 'Erreur lors de la réclamation du NFT de fidélité';
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setPurchasing(false);
    }
  }, []);

  // Vérifier l'accès aux plans
  const hasAccessToPlans = useCallback((plans: string[]): boolean => {
    if (!userNFTInfo || userNFTInfo.highestTier === 0) {
      return false;
    }

    return plans.every(plan => {
      switch (plan.toLowerCase()) {
        case 'starter':
          return userNFTInfo.hasAccess.starter;
        case 'standard':
          return userNFTInfo.hasAccess.standard;
        case 'premium':
          return userNFTInfo.hasAccess.premium;
        case 'privilege':
          return userNFTInfo.hasAccess.privilege;
        default:
          return false;
      }
    });
  }, [userNFTInfo]);

  // Obtenir le multiplicateur NFT
  const getNFTMultiplier = useCallback((): number => {
    if (!userNFTInfo || userNFTInfo.highestTier === 0) {
      return 1.0; // Pas de bonus
    }

    switch (userNFTInfo.highestTier) {
      case 1: return 1.2;  // Bronze: +20%
      case 2: return 1.5;  // Argent: +50%
      case 3: return 2.0;  // Or: +100%
      case 4: return 2.5;  // Privilège: +150%
      default: return 1.0;
    }
  }, [userNFTInfo]);

  // Vérifier si l'utilisateur peut acheter un tier
  const canPurchaseTier = useCallback((tierId, balance) => {
  // Afficher les détails pour le débogage
  console.log('🔍 DEBUG canPurchaseTier détails:', {
    tierId,
    balance,
    tiersInfo,
    tierExists: tiersInfo && tiersInfo[tierId] !== undefined,
    tierActive: tiersInfo && tiersInfo[tierId]?.active,
    priceUSDC: tiersInfo && tiersInfo[tierId]?.price,
    remaining: tiersInfo && tiersInfo[tierId]?.remaining
  });

  // Si les données ne sont pas encore chargées, autoriser temporairement (sera mis à jour)
  if (!tiersInfo || !tiersInfo[tierId]) {
    console.log('📣 Tier info not loaded yet, temporarily allowing purchase');
    return true;
  }

  const tierInfo = tiersInfo[tierId];
  
  // Vérifier si le tier est actif
  if (!tierInfo.active) {
    console.log('📣 Tier not active');
    return false;
  }
  
  // Vérifier s'il reste des NFT disponibles
  if (tierInfo.remaining <= 0) {
    console.log('📣 No NFTs remaining');
    return false;
  }
  
  // Vérifier la balance USDC (avec une marge d'erreur pour les arrondis)
  const price = parseFloat(tierInfo.price);
  const hasEnoughBalance = balance >= price - 0.01; // Petite tolérance
  
  if (!hasEnoughBalance) {
    console.log('📣 Insufficient balance', { balance, price });
  }
  
  return hasEnoughBalance;
}, [tiersInfo]);

  // Suite du useEffect - Écouter les événements de la blockchain
  useEffect(() => {
    const handleNFTPurchased = (buyer: string, tokenId: number, tier: number, price: string) => {
      console.log('🎉 NFT acheté détecté:', { buyer, tokenId, tier, price });
      
      // Recharger les infos si c'est l'utilisateur actuel
      // Note: il faudrait avoir l'adresse de l'utilisateur connecté ici
      loadTiersInfo(); // Recharger pour mettre à jour les supplies
    };

    const handleFidelityNFTClaimed = (user: string, tokenId: number) => {
      console.log('🎁 NFT fidélité réclamé détecté:', { user, tokenId });
      loadTiersInfo(); // Recharger pour mettre à jour les supplies
    };

    // Écouter les événements
    nftService.onNFTPurchased(handleNFTPurchased);
    nftService.onFidelityNFTClaimed(handleFidelityNFTClaimed);

    // Cleanup
    return () => {
      nftService.removeAllListeners();
    };
  }, [loadTiersInfo]);

  // Charger les infos des tiers au montage
  useEffect(() => {
    loadTiersInfo();
  }, [loadTiersInfo]);

  return {
    // État
    userNFTInfo,
    tiersInfo,
    loading,
    error,
    purchasing,
    
    // Actions
    loadUserNFTs,
    loadTiersInfo,
    purchaseNFT,
    claimFidelityNFT,
    
    // Utilitaires
    hasAccessToPlans,
    getNFTMultiplier,
    canPurchaseTier
  };
};

// Hook personnalisé pour les informations de tier spécifique
export const useNFTTier = (tier: number) => {
  const { tiersInfo, loading } = useNFT();
  
  return {
    tierInfo: tiersInfo[tier] || null,
    loading
  };
};

// Hook pour les accès utilisateur
export const useNFTAccess = (userAddress: string | null) => {
  const { userNFTInfo, loadUserNFTs, loading } = useNFT();
  
  useEffect(() => {
    if (userAddress) {
      loadUserNFTs(userAddress);
    }
  }, [userAddress, loadUserNFTs]);

  return {
    hasNFT: userNFTInfo?.highestTier > 0,
    highestTier: userNFTInfo?.highestTier || 0,
    multiplier: userNFTInfo ? (() => {
      switch (userNFTInfo.highestTier) {
        case 1: return 1.2;
        case 2: return 1.5;
        case 3: return 2.0;
        case 4: return 2.5;
        default: return 1.0;
      }
    })() : 1.0,
    access: {
      starter: userNFTInfo?.hasAccess.starter || false,
      standard: userNFTInfo?.hasAccess.standard || false,
      premium: userNFTInfo?.hasAccess.premium || false,
      privilege: userNFTInfo?.hasAccess.privilege || false
    },
    ownedTiers: userNFTInfo?.ownedTiers || [],
    loading
  };
};

export default useNFT;