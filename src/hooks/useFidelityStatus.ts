// hooks/useFidelityStatus.ts - Version finale utilisant le NFTService adapté
import { useState, useEffect } from 'react';
import extensibleNFTService, { FidelityStatusResponse } from '../services/NFTService';

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
  inconsistencyDetected: boolean; // Pour détecter les incohérences
  error?: string;
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

  useEffect(() => {
    const checkFidelity = async () => {
      if (!walletAddress) {
        setFidelityData(prev => ({ 
          ...prev, 
          loading: false,
          isFidel: false,
          hasClaimedNFT: false,
          actuallyOwnsNFT: false
        }));
        return;
      }

      try {
        setFidelityData(prev => ({ ...prev, loading: true, error: undefined }));
        
        console.log('🔍 Vérification fidélité pour:', walletAddress);
        
        // Utiliser le NFTService pour obtenir le statut complet
        const backendStatus = await extensibleNFTService.getFidelityStatusFromBackend(walletAddress);
        
        console.log('📊 Statut backend:', backendStatus);
        
        // Vérifier la cohérence
        const inconsistency = backendStatus.hasClaimedNFT && !backendStatus.actuallyOwnsNFT;
        
        setFidelityData({
          isFidel: backendStatus.isFidel,
          hasClaimedNFT: backendStatus.hasClaimedNFT,
          actuallyOwnsNFT: backendStatus.actuallyOwnsNFT,
          highestTier: backendStatus.highestTier,
          userInfo: backendStatus.userInfo,
          loading: false,
          inconsistencyDetected: inconsistency,
          error: undefined
        });

        // Log pour debug
        if (inconsistency) {
          console.warn('🔄 Incohérence détectée:', {
            hasClaimedNFT: backendStatus.hasClaimedNFT,
            actuallyOwnsNFT: backendStatus.actuallyOwnsNFT,
            walletAddress
          });
        }

        // Vérification supplémentaire de cohérence via NFTService
        if (inconsistency) {
          const consistencyCheck = await extensibleNFTService.checkFidelityConsistency(walletAddress);
          console.log('🔍 Vérification cohérence:', consistencyCheck);
        }

      } catch (error: any) {
        console.error('❌ Erreur vérification fidélité:', error);
        setFidelityData({
          isFidel: false,
          hasClaimedNFT: false,
          actuallyOwnsNFT: false,
          highestTier: '0',
          userInfo: null,
          loading: false,
          inconsistencyDetected: false,
          error: error.message || 'Erreur de vérification'
        });
      }
    };

    checkFidelity();
  }, [walletAddress]);

  // Fonction pour synchroniser manuellement
  const syncStatus = async (): Promise<boolean> => {
    if (!walletAddress) return false;
    
    try {
      console.log('🔄 Synchronisation du statut fidélité...');
      
      const result = await extensibleNFTService.syncFidelityStatus(walletAddress);
      
      if (result.success) {
        console.log('✅ Synchronisation réussie:', result);
        
        // Recharger le statut après synchronisation
        const newStatus = await extensibleNFTService.getFidelityStatusFromBackend(walletAddress);
        
        setFidelityData({
          isFidel: newStatus.isFidel,
          hasClaimedNFT: newStatus.hasClaimedNFT,
          actuallyOwnsNFT: newStatus.actuallyOwnsNFT,
          highestTier: newStatus.highestTier,
          userInfo: newStatus.userInfo,
          loading: false,
          inconsistencyDetected: false, // Réinitialiser après sync
          error: undefined
        });
        
        return true;
      } else {
        console.error('❌ Erreur synchronisation:', result.error);
        setFidelityData(prev => ({ 
          ...prev, 
          error: result.error || 'Erreur de synchronisation' 
        }));
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur synchronisation:', error);
      setFidelityData(prev => ({ 
        ...prev, 
        error: error.message || 'Erreur de synchronisation' 
      }));
      return false;
    }
  };

  // Fonction pour forcer le rechargement du statut
  const reloadStatus = async (): Promise<void> => {
    if (!walletAddress) return;
    
    setFidelityData(prev => ({ ...prev, loading: true }));
    
    try {
      const backendStatus = await extensibleNFTService.getFidelityStatusFromBackend(walletAddress);
      const inconsistency = backendStatus.hasClaimedNFT && !backendStatus.actuallyOwnsNFT;
      
      setFidelityData({
        isFidel: backendStatus.isFidel,
        hasClaimedNFT: backendStatus.hasClaimedNFT,
        actuallyOwnsNFT: backendStatus.actuallyOwnsNFT,
        highestTier: backendStatus.highestTier,
        userInfo: backendStatus.userInfo,
        loading: false,
        inconsistencyDetected: inconsistency,
        error: undefined
      });
    } catch (error: any) {
      console.error('❌ Erreur rechargement statut:', error);
      setFidelityData(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Erreur de rechargement'
      }));
    }
  };

  // Fonction pour réclamer le NFT de fidélité
  const claimFidelityNFT = async (): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
  }> => {
    if (!walletAddress) {
      return { success: false, error: 'Adresse wallet manquante' };
    }

    try {
      console.log('🎁 Début réclamation NFT fidélité...');
      
      const result = await extensibleNFTService.claimFidelityNFT(walletAddress);
      
      if (result.success) {
        console.log('✅ NFT fidélité réclamé avec succès:', result);
        
        // Recharger le statut après réclamation réussie
        await reloadStatus();
        
        return {
          success: true,
          txHash: result.txHash,
          tokenId: result.tokenId
        };
      } else {
        console.error('❌ Erreur réclamation NFT:', result.error);
        return {
          success: false,
          error: result.error || 'Erreur lors de la réclamation'
        };
      }
    } catch (error: any) {
      console.error('❌ Erreur réclamation NFT fidélité:', error);
      return {
        success: false,
        error: error.message || 'Erreur inattendue'
      };
    }
  };

  // Fonction pour vérifier l'éligibilité
  const checkEligibility = (): {
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
        reason: 'NFT Privilège déjà possédé' 
      };
    }

    if (fidelityData.hasClaimedNFT && !fidelityData.inconsistencyDetected) {
      return { 
        canClaim: false, 
        reason: 'NFT déjà réclamé' 
      };
    }

    return { canClaim: true };
  };

  // Fonction utilitaire pour obtenir le message d'état
  const getStatusMessage = (): string => {
    if (fidelityData.loading) return 'Vérification en cours...';
    if (fidelityData.error) return `Erreur: ${fidelityData.error}`;
    
    if (!fidelityData.isFidel) return 'Non éligible pour la fidélité';
    
    if (fidelityData.inconsistencyDetected) {
      return 'Synchronisation requise - données incohérentes';
    }
    
    if (fidelityData.actuallyOwnsNFT) return 'NFT Privilège possédé';
    
    if (fidelityData.hasClaimedNFT) return 'NFT déjà réclamé';
    
    return 'Éligible pour réclamer un NFT Privilège';
  };

  return { 
    ...fidelityData, 
    syncStatus,
    reloadStatus,
    claimFidelityNFT,
    checkEligibility,
    getStatusMessage
  };
};