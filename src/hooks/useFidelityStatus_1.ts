import { useState, useEffect, useCallback } from 'react';
import extensibleNFTService, { FidelityStatusResponse } from '../services/NFTService';
import { FIDELITY_NFT_CONFIG, getFidelityMessages } from '../config/fidelityConfig';

interface FidelityState {
  isFidel: boolean;
  hasClaimedNFT: boolean; // Statut en base de données
  actuallyOwnsNFT: boolean; // Statut réel blockchain
  highestTier: string;
  userInfo: {
    firstName?: string;
    email?: string;
    claimedAt?: string;
    txHash?: string;
  } | null;
  loading: boolean;
  inconsistencyDetected: boolean;
  error?: string;
  // 🎁 NOUVEAU - Informations spécifiques NFT Fidélité
  fidelityNFT?: {
    tier: number;
    name: string;
    canClaim: boolean;
    supply: number;
    remaining: number;
    userOwns: boolean;
  };
}

export const useFidelityStatus = (walletAddress: string | null) => {
  const [fidelityData, setFidelityData] = useState<FidelityState>({
    isFidel: false,
    hasClaimedNFT: false,
    actuallyOwnsNFT: false,
    highestTier: '0',
    userInfo: null,
    loading: true,
    inconsistencyDetected: false
  });

  // 🔧 ADAPTÉ - Fonction de vérification avec NFT Fidélité
  const checkFidelity = useCallback(async () => {
    if (!walletAddress) {
      setFidelityData(prev => ({ 
        ...prev, 
        loading: false,
        isFidel: false,
        hasClaimedNFT: false,
        actuallyOwnsNFT: false,
        fidelityNFT: undefined
      }));
      return;
    }

    try {
      setFidelityData(prev => ({ ...prev, loading: true, error: undefined }));
      
      console.log(`🔍 Vérification fidélité ${FIDELITY_NFT_CONFIG.displayName} pour:`, walletAddress);
      
      // Utiliser le NFTService pour obtenir le statut complet
      const backendStatus = await extensibleNFTService.getFidelityStatusFromBackend(walletAddress);
      
      console.log('📊 Statut backend NFT Fidélité:', backendStatus);
      
      // 🔧 ADAPTÉ - Vérifier la cohérence pour le tier 5
      const inconsistency = backendStatus.hasClaimedNFT && !backendStatus.actuallyOwnsNFT;
      
      setFidelityData({
        isFidel: backendStatus.isFidel,
        hasClaimedNFT: backendStatus.hasClaimedNFT,
        actuallyOwnsNFT: backendStatus.actuallyOwnsNFT,
        highestTier: backendStatus.highestTier,
        userInfo: backendStatus.userInfo,
        loading: false,
        inconsistencyDetected: inconsistency,
        error: undefined,
        // 🎁 NOUVEAU - Informations NFT Fidélité
        fidelityNFT: backendStatus.fidelityNFT ? {
          tier: backendStatus.fidelityNFT.tier,
          name: backendStatus.fidelityNFT.name,
          canClaim: backendStatus.fidelityNFT.canClaim,
          supply: backendStatus.fidelityNFT.supply,
          remaining: backendStatus.fidelityNFT.remaining,
          userOwns: backendStatus.fidelityNFT.userOwns
        } : {
          tier: FIDELITY_NFT_CONFIG.tier,
          name: FIDELITY_NFT_CONFIG.name,
          canClaim: backendStatus.isFidel && !backendStatus.hasClaimedNFT && !backendStatus.actuallyOwnsNFT,
          supply: FIDELITY_NFT_CONFIG.supply,
          remaining: FIDELITY_NFT_CONFIG.supply - 5, // Estimation
          userOwns: backendStatus.actuallyOwnsNFT
        }
      });

      if (inconsistency) {
        console.warn(`🔄 Incohérence détectée pour ${FIDELITY_NFT_CONFIG.displayName}:`, {
          hasClaimedNFT: backendStatus.hasClaimedNFT,
          actuallyOwnsNFT: backendStatus.actuallyOwnsNFT,
          walletAddress,
          tier: FIDELITY_NFT_CONFIG.tier
        });
      }

      // Vérification supplémentaire de cohérence via NFTService
      if (inconsistency) {
        const consistencyCheck = await extensibleNFTService.checkFidelityConsistency(walletAddress);
        console.log('🔍 Vérification cohérence NFT Fidélité:', consistencyCheck);
      }

    } catch (error: any) {
      console.error(`❌ Erreur vérification fidélité ${FIDELITY_NFT_CONFIG.displayName}:`, error);
      setFidelityData({
        isFidel: false,
        hasClaimedNFT: false,
        actuallyOwnsNFT: false,
        highestTier: '0',
        userInfo: null,
        loading: false,
        inconsistencyDetected: false,
        error: error.message || 'Erreur de vérification',
        fidelityNFT: undefined
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    checkFidelity();
  }, [checkFidelity]);

  // 🔧 ADAPTÉ - Fonction de synchronisation pour NFT Fidélité
  const syncStatus = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false;
    
    try {
      setFidelityData(prev => ({ ...prev, loading: true }));
      
      console.log('🔄 Synchronisation du statut NFT Fidélité...');
      
      const result = await extensibleNFTService.syncFidelityStatus(walletAddress);
      
      if (result.success) {
        console.log('✅ Synchronisation NFT Fidélité réussie:', result);
        
        // Recharger le statut après synchronisation
        await checkFidelity();
        
        return true;
      } else {
        console.error('❌ Erreur synchronisation NFT Fidélité:', result.error);
        setFidelityData(prev => ({ 
          ...prev, 
          loading: false,
          error: result.error || 'Erreur de synchronisation' 
        }));
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur synchronisation NFT Fidélité:', error);
      setFidelityData(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Erreur de synchronisation' 
      }));
      return false;
    }
  }, [walletAddress, checkFidelity]);

  // 🔧 ADAPTÉ - Fonction de rechargement
  const reloadStatus = useCallback(async (): Promise<void> => {
    await checkFidelity();
  }, [checkFidelity]);

  // 🔧 ADAPTÉ - Fonction de réclamation NFT Fidélité
  const claimFidelityNFT = useCallback(async (): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
  }> => {
    if (!walletAddress) {
      return { success: false, error: 'Adresse wallet manquante' };
    }

    try {
      console.log(`🎁 Début réclamation ${FIDELITY_NFT_CONFIG.displayName}...`);
      
      // Vérifier l'éligibilité avant de procéder
      const eligibilityCheck = await extensibleNFTService.canUserClaimFidelityNFT(walletAddress);
      if (!eligibilityCheck.canClaim) {
        return {
          success: false,
          error: eligibilityCheck.reason || 'Non éligible pour la réclamation'
        };
      }
      
      const result = await extensibleNFTService.claimFidelityNFT(walletAddress);
      
      if (result.success) {
        console.log(`✅ ${FIDELITY_NFT_CONFIG.displayName} réclamé avec succès:`, result);
        
        // Recharger le statut après réclamation réussie
        await checkFidelity();
        
        return {
          success: true,
          txHash: result.txHash,
          tokenId: result.tokenId
        };
      } else {
        console.error(`❌ Erreur réclamation ${FIDELITY_NFT_CONFIG.displayName}:`, result.error);
        return {
          success: false,
          error: result.error || 'Erreur lors de la réclamation'
        };
      }
    } catch (error: any) {
      console.error(`❌ Erreur réclamation ${FIDELITY_NFT_CONFIG.displayName}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur inattendue'
      };
    }
  }, [walletAddress, checkFidelity]);

  // 🔧 ADAPTÉ - Fonction pour vérifier l'éligibilité NFT Fidélité
  const checkEligibility = useCallback((): {
    canClaim: boolean;
    reason?: string;
  } => {
    if (!fidelityData.isFidel) {
      return { 
        canClaim: false, 
        reason: 'Non éligible pour la fidélité' 
      };
    }

    if (fidelityData.actuallyOwnsNFT) {
      return { 
        canClaim: false, 
        reason: `${FIDELITY_NFT_CONFIG.displayName} déjà possédé` 
      };
    }

    if (fidelityData.hasClaimedNFT && !fidelityData.inconsistencyDetected) {
      return { 
        canClaim: false, 
        reason: `${FIDELITY_NFT_CONFIG.displayName} déjà réclamé` 
      };
    }

    if (fidelityData.inconsistencyDetected) {
      return { 
        canClaim: false, 
        reason: 'Synchronisation requise - données incohérentes' 
      };
    }

    // Vérifier le supply disponible
    if (fidelityData.fidelityNFT && fidelityData.fidelityNFT.remaining <= 0) {
      return { 
        canClaim: false, 
        reason: `Stock de ${FIDELITY_NFT_CONFIG.displayName} épuisé` 
      };
    }

    return { canClaim: true };
  }, [fidelityData.isFidel, fidelityData.actuallyOwnsNFT, fidelityData.hasClaimedNFT, fidelityData.inconsistencyDetected, fidelityData.fidelityNFT]);

  // 🔧 ADAPTÉ - Messages de statut pour NFT Fidélité
  const getStatusMessage = useCallback((): string => {
    const messages = getFidelityMessages();
    
    if (fidelityData.loading) return 'Vérification en cours...';
    if (fidelityData.error) return `Erreur: ${fidelityData.error}`;
    
    if (!fidelityData.isFidel) return messages.notEligible;
    
    if (fidelityData.inconsistencyDetected) {
      return 'Synchronisation requise - données incohérentes';
    }
    
    if (fidelityData.actuallyOwnsNFT) return messages.owned;
    
    if (fidelityData.hasClaimedNFT) return messages.claimed;
    
    if (fidelityData.fidelityNFT && fidelityData.fidelityNFT.remaining <= 0) {
      return `Stock de ${FIDELITY_NFT_CONFIG.displayName} épuisé`;
    }
    
    return messages.eligible;
  }, [fidelityData.loading, fidelityData.error, fidelityData.isFidel, fidelityData.inconsistencyDetected, fidelityData.actuallyOwnsNFT, fidelityData.hasClaimedNFT, fidelityData.fidelityNFT]);

  // 🎁 NOUVEAU - Fonction pour obtenir des statistiques détaillées
  const getFidelityStats = useCallback(async () => {
    try {
      const stats = await extensibleNFTService.getFidelityNFTStats();
      return stats;
    } catch (error) {
      console.error('Erreur récupération statistiques NFT Fidélité:', error);
      return null;
    }
  }, []);

  // 🎁 NOUVEAU - Fonction de validation de l'environnement
  const validateEnvironment = useCallback(async () => {
    try {
      const validation = await extensibleNFTService.validateFidelityEnvironment();
      return validation;
    } catch (error) {
      console.error('Erreur validation environnement NFT Fidélité:', error);
      return {
        valid: false,
        issues: ['Erreur de validation'],
        recommendations: []
      };
    }
  }, []);

  return { 
    ...fidelityData, 
    syncStatus,
    reloadStatus,
    claimFidelityNFT,
    checkEligibility,
    getStatusMessage,
    // 🎁 NOUVELLES FONCTIONS
    getFidelityStats,
    validateEnvironment,
    // 🎁 NOUVELLES PROPRIÉTÉS
    fidelityNFTConfig: FIDELITY_NFT_CONFIG
  };
};