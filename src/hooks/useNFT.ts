// hooks/useNFT.ts - Version corrigée avec gestion d'erreurs

import { useState, useEffect, useCallback } from 'react';
import extensibleNFTService from '../services/NFTService';

interface UseNFTState {
  userNFTInfo: any;
  tiersInfo: Record<number, any>;
  loading: boolean;
  error: string | null;
  purchasing: boolean;
  initialized: boolean;
}

export const useNFT = () => {
  const [state, setState] = useState<UseNFTState>({
    userNFTInfo: null,
    tiersInfo: {},
    loading: true,
    error: null,
    purchasing: false,
    initialized: false
  });

  // Charger les infos des tiers de manière sécurisée
  const loadTiersInfo = useCallback(async () => {
    try {
      console.log('🔄 Hook useNFT: Chargement des tiers...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const tiersInfo = await extensibleNFTService.loadTiersInfoSafely();
      
      setState(prev => ({ 
        ...prev, 
        tiersInfo,
        loading: false,
        initialized: true
      }));
      
      console.log('✅ Hook useNFT: Tiers chargés:', tiersInfo);
    } catch (error: any) {
      console.error('❌ Hook useNFT: Erreur chargement tiers:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Erreur chargement des NFT',
        loading: false 
      }));
    }
  }, []);

  // Charger les NFT de l'utilisateur
  const loadUserNFTs = useCallback(async (userAddress: string) => {
    if (!userAddress) {
      setState(prev => ({ ...prev, userNFTInfo: null }));
      return;
    }

    try {
      console.log('🔄 Hook useNFT: Chargement NFT utilisateur:', userAddress);
      
      const userNFTInfo = await extensibleNFTService.loadUserNFTInfoSafely(userAddress);
      
      setState(prev => ({ ...prev, userNFTInfo }));
      
      console.log('✅ Hook useNFT: NFT utilisateur chargés:', userNFTInfo);
    } catch (error: any) {
      console.error('❌ Hook useNFT: Erreur chargement NFT utilisateur:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Erreur chargement NFT utilisateur' 
      }));
    }
  }, []);

  // Acheter un NFT
  const purchaseNFT = useCallback(async (tier: number) => {
    setState(prev => ({ ...prev, purchasing: true, error: null }));
    
    try {
      console.log(`🛒 Hook useNFT: Achat NFT tier ${tier}...`);
      
      const txHash = await extensibleNFTService.purchaseNFT(tier);
      
      console.log('✅ Hook useNFT: NFT acheté, hash:', txHash);
      
      setState(prev => ({ ...prev, purchasing: false }));
      
      return { success: true, txHash };
    } catch (error: any) {
      console.error('❌ Hook useNFT: Erreur achat NFT:', error);
      setState(prev => ({ 
        ...prev, 
        purchasing: false,
        error: error.message || 'Erreur lors de l\'achat'
      }));
      
      return { success: false, error: error.message };
    }
  }, []);

  // Réclamer NFT de fidélité
  const claimFidelityNFT = useCallback(async (userAddress: string) => {
    setState(prev => ({ ...prev, purchasing: true, error: null }));
    
    try {
      console.log('🎁 Hook useNFT: Réclamation NFT fidélité...');
      
      const result = await extensibleNFTService.claimFidelityNFT(userAddress);
      
      setState(prev => ({ ...prev, purchasing: false }));
      
      if (result.success) {
        console.log('✅ Hook useNFT: NFT fidélité réclamé:', result.txHash);
        return { success: true, txHash: result.txHash, tokenId: result.tokenId };
      } else {
        console.error('❌ Hook useNFT: Échec réclamation:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Hook useNFT: Erreur réclamation NFT:', error);
      setState(prev => ({ 
        ...prev, 
        purchasing: false,
        error: error.message || 'Erreur lors de la réclamation'
      }));
      
      return { success: false, error: error.message };
    }
  }, []);

  // Vérifier si l'utilisateur peut acheter un tier
  const canPurchaseTier = useCallback((tier: number, userBalance: number): boolean => {
    const tierInfo = state.tiersInfo[tier];
    if (!tierInfo) return false;
    
    const hasBalance = userBalance >= parseFloat(tierInfo.price);
    const hasSupply = tierInfo.remaining > 0;
    const isActive = tierInfo.active;
    
    return hasBalance && hasSupply && isActive;
  }, [state.tiersInfo]);

  // Obtenir le multiplicateur NFT
  const getNFTMultiplier = useCallback((): number => {
    if (!state.userNFTInfo || state.userNFTInfo.highestTier === 0) {
      return 1.0;
    }
    
    return state.userNFTInfo.highestMultiplier / 100;
  }, [state.userNFTInfo]);

  // Initialisation et écoute des événements
  useEffect(() => {
    console.log('🔄 Hook useNFT: Initialisation...');
    
    // Charger les tiers au montage
    loadTiersInfo();

    // Configuration des écouteurs d'événements avec vérification
    let unsubscribeNFTPurchased: (() => void) | undefined;
    let unsubscribeFidelityNFTClaimed: (() => void) | undefined;
    let unsubscribeTierCreated: (() => void) | undefined;

    const setupEventListeners = async () => {
      try {
        // Vérifier que les méthodes existent avant de les utiliser
        if (typeof extensibleNFTService.onNFTPurchased === 'function') {
          unsubscribeNFTPurchased = extensibleNFTService.onNFTPurchased((buyer, tokenId, tier, price) => {
            console.log('🎉 NFT acheté:', { buyer, tokenId, tier, price });
            // Recharger les données après un achat
            loadTiersInfo();
          });
        } else {
          console.warn('⚠️ Méthode onNFTPurchased non disponible dans le service');
        }

        if (typeof extensibleNFTService.onFidelityNFTClaimed === 'function') {
          unsubscribeFidelityNFTClaimed = extensibleNFTService.onFidelityNFTClaimed((user, tokenId) => {
            console.log('🎁 NFT fidélité réclamé:', { user, tokenId });
            loadTiersInfo();
          });
        } else {
          console.warn('⚠️ Méthode onFidelityNFTClaimed non disponible dans le service');
        }

        if (typeof extensibleNFTService.onTierCreated === 'function') {
          unsubscribeTierCreated = extensibleNFTService.onTierCreated((tier, name, price, supply) => {
            console.log('🆕 Nouveau tier créé:', { tier, name, price, supply });
            loadTiersInfo();
          });
        } else {
          console.warn('⚠️ Méthode onTierCreated non disponible dans le service');
        }

      } catch (error) {
        console.error('❌ Erreur configuration écouteurs:', error);
      }
    };

    // Configuration avec délai pour laisser le service s'initialiser
    const timeoutId = setTimeout(setupEventListeners, 1000);

    // Nettoyage
    return () => {
      clearTimeout(timeoutId);
      
      try {
        if (unsubscribeNFTPurchased) unsubscribeNFTPurchased();
        if (unsubscribeFidelityNFTClaimed) unsubscribeFidelityNFTClaimed();
        if (unsubscribeTierCreated) unsubscribeTierCreated();
      } catch (error) {
        console.error('❌ Erreur nettoyage écouteurs:', error);
      }
    };
  }, [loadTiersInfo]);

  // Test de connectivité périodique
  useEffect(() => {
    const testConnectivity = async () => {
      try {
        const connectionTest = await extensibleNFTService.testConnection();
        console.log('🔍 Test connectivité NFT:', connectionTest);
        
        if (!connectionTest.contractAccessible && state.initialized) {
          setState(prev => ({ 
            ...prev, 
            error: 'Impossible de se connecter au contrat NFT' 
          }));
        }
      } catch (error) {
        console.error('❌ Erreur test connectivité:', error);
      }
    };

    // Test initial après 2 secondes
    const testTimeoutId = setTimeout(testConnectivity, 2000);
    
    // Test périodique toutes les 30 secondes si il y a une erreur
    let intervalId: NodeJS.Timeout | undefined;
    if (state.error) {
      intervalId = setInterval(testConnectivity, 30000);
    }

    return () => {
      clearTimeout(testTimeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [state.error, state.initialized]);

  return {
    // État
    userNFTInfo: state.userNFTInfo,
    tiersInfo: state.tiersInfo,
    loading: state.loading,
    error: state.error,
    purchasing: state.purchasing,
    initialized: state.initialized,
    
    // Actions
    loadUserNFTs,
    loadTiersInfo,
    purchaseNFT,
    claimFidelityNFT,
    canPurchaseTier,
    getNFTMultiplier,
    
    // Utilitaires
    clearError: () => setState(prev => ({ ...prev, error: null })),
    retry: () => loadTiersInfo()
  };
};

export default useNFT;