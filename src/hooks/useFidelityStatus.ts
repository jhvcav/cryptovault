//src/hooks/useFidelityStatus.ts - Version avec votre smart contract existant
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FIDELITY_NFT_CONFIG, getFidelityMessages } from '../config/fidelityConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes dans .env:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FidelityState {
  isFidel: boolean;
  hasClaimedNFT: boolean;
  actuallyOwnsNFT: boolean;
  highestTier: string;
  userInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    claimedAt?: string;
    txHash?: string;
  } | null;
  loading: boolean;
  inconsistencyDetected: boolean;
  error?: string;
  fidelityNFT?: {
    tier: number;
    name: string;
    canClaim: boolean;
    supply: number;
    remaining: number;
    userOwns: boolean;
  };
  // Nouveaux états pour la blockchain
  claiming: boolean;
  lastClaimResult?: {
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
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
    inconsistencyDetected: false,
    claiming: false
  });

  // Vérification directe dans Supabase
  const checkFidelityDirectInSupabase = useCallback(async (address: string) => {
    try {
      console.log(`🔍 Vérification Supabase pour: ${address}`);

      const { data: user, error } = await supabase
        .from('users_authorized')
        .select(`
          id,
          wallet_address,
          first_name,
          last_name,
          status,
          fidelity_status,
          fidelity_nft_claimed,
          fidelity_nft_claimed_date,
          user_type_id
        `)
        .eq('wallet_address', address.toLowerCase())
        .eq('status', 'Active')
        .single();

      if (error && error.code === 'PGRST116') {
        return {
          isFidel: false,
          hasClaimedNFT: false,
          userInfo: null
        };
      }

      if (error) {
        throw new Error(error.message);
      }

      if (!user) {
        return {
          isFidel: false,
          hasClaimedNFT: false,
          userInfo: null
        };
      }

      const isFidel = user.fidelity_status === 'OUI';
      const hasClaimedNFT = user.fidelity_nft_claimed === 'true' || user.fidelity_nft_claimed === true;

      return {
        isFidel,
        hasClaimedNFT,
        userInfo: isFidel ? {
          firstName: user.first_name || 'Utilisateur',
          lastName: user.last_name || '',
          email: `${user.first_name?.toLowerCase() || 'user'}@exemple.com`,
          claimedAt: user.fidelity_nft_claimed_date || null
        } : null
      };

    } catch (error: any) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }
  }, []);

  // Fonction principale de vérification avec blockchain
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

    if (!supabaseUrl || !supabaseAnonKey) {
      setFidelityData(prev => ({
        ...prev,
        loading: false,
        error: 'Configuration Supabase manquante'
      }));
      return;
    }

    try {
      setFidelityData(prev => ({ ...prev, loading: true, error: undefined }));
      
      console.log(`🔍 Vérification fidélité complète pour:`, walletAddress);
      
      // 1. Vérification Supabase
      const supabaseStatus = await checkFidelityDirectInSupabase(walletAddress);
      
      // 2. Vérification blockchain
      let blockchainOwnership = {
        hasNFT: false,
        highestTier: 0,
        balance: 0
      };

      try {
        // ✅ UTILISER VOTRE NFTService EXISTANT
        const extensibleNFTService = (await import('../services/NFTService')).default;
        const hasFidelityNFT = await extensibleNFTService.userHasFidelityNFT(walletAddress);
        const highestTier = await extensibleNFTService.getUserHighestTier(walletAddress);
        
        blockchainOwnership = {
          hasNFT: hasFidelityNFT,
          highestTier: highestTier,
          balance: hasFidelityNFT ? 1 : 0
        };
        
        console.log('🔗 Vérification blockchain:', blockchainOwnership);
      } catch (blockchainError) {
        console.warn('⚠️ Erreur vérification blockchain:', blockchainError);
      }
      
      // 3. Analyser les résultats
      const actuallyOwnsNFT = blockchainOwnership.hasNFT && blockchainOwnership.highestTier >= 5;
      const inconsistency = supabaseStatus.hasClaimedNFT && !actuallyOwnsNFT;
      
      setFidelityData({
        isFidel: supabaseStatus.isFidel,
        hasClaimedNFT: supabaseStatus.hasClaimedNFT,
        actuallyOwnsNFT,
        highestTier: Math.max(blockchainOwnership.highestTier, supabaseStatus.hasClaimedNFT ? 5 : 0).toString(),
        userInfo: supabaseStatus.userInfo,
        loading: false,
        inconsistencyDetected: inconsistency,
        error: undefined,
        claiming: false,
        fidelityNFT: {
          tier: FIDELITY_NFT_CONFIG.tier,
          name: FIDELITY_NFT_CONFIG.name,
          canClaim: supabaseStatus.isFidel && !supabaseStatus.hasClaimedNFT && !actuallyOwnsNFT,
          supply: FIDELITY_NFT_CONFIG.supply,
          remaining: FIDELITY_NFT_CONFIG.supply - 1,
          userOwns: actuallyOwnsNFT
        }
      });

      if (inconsistency) {
        console.warn(`🔄 Incohérence détectée:`, {
          hasClaimedNFT: supabaseStatus.hasClaimedNFT,
          actuallyOwnsNFT,
          walletAddress
        });
      }

    } catch (error: any) {
      console.error(`❌ Erreur vérification fidélité:`, error);
      setFidelityData({
        isFidel: false,
        hasClaimedNFT: false,
        actuallyOwnsNFT: false,
        highestTier: '0',
        userInfo: null,
        loading: false,
        inconsistencyDetected: false,
        claiming: false,
        error: error.message || 'Erreur de vérification',
        fidelityNFT: undefined
      });
    }
  }, [walletAddress, checkFidelityDirectInSupabase]);

  useEffect(() => {
    checkFidelity();
  }, [checkFidelity]);

  // ✅ FONCTION DE RÉCLAMATION AVEC VOTRE SMART CONTRACT
  const claimMyFidelityNFT = useCallback(async (): Promise<FidelityNFTResult> => {
    if (!walletAddress) {
      return { success: false, error: 'Adresse wallet manquante' };
    }

    try {
      setFidelityData(prev => ({ ...prev, claiming: true, error: undefined }));
      
      console.log(`🎁 Début réclamation NFT Fidélité sur blockchain...`);
      
      // Vérifications préliminaires
      if (!fidelityData.isFidel) {
        throw new Error('Non éligible pour la réclamation');
      }

      if (fidelityData.hasClaimedNFT && !fidelityData.inconsistencyDetected) {
        throw new Error('NFT Fidélité déjà réclamé');
      }

      if (fidelityData.actuallyOwnsNFT) {
        throw new Error('NFT Fidélité déjà possédé');
      }

      // ✅ UTILISER VOTRE NFTService EXISTANT
      const extensibleNFTService = (await import('../services/NFTService')).default;
      const result = await extensibleNFTService.claimMyFidelityNFT(walletAddress);
      
      setFidelityData(prev => ({ 
        ...prev, 
        claiming: false,
        lastClaimResult: result
      }));

      if (result.success) {
        console.log('✅ NFT Fidélité réclamé avec succès:', result);
        
        // Mettre à jour la base de données via Supabase
        try {
          const { error: updateError } = await supabase
            .from('users_authorized')
            .update({
              fidelity_nft_claimed: 'true',
              fidelity_nft_claimed_date: new Date().toISOString()
            })
            .eq('wallet_address', walletAddress.toLowerCase())
            .eq('fidelity_status', 'OUI');

          if (updateError) {
            console.warn('⚠️ Erreur mise à jour base de données:', updateError);
          } else {
            console.log('✅ Base de données mise à jour');
          }
        } catch (dbError) {
          console.warn('⚠️ Erreur synchronisation base de données:', dbError);
        }
        
        // Recharger le statut après succès
        setTimeout(() => {
          checkFidelity();
        }, 2000);
        
        return result;
      } else {
        console.error('❌ Erreur réclamation:', result.error);
        setFidelityData(prev => ({ 
          ...prev, 
          error: result.error 
        }));
        return result;
      }
      
    } catch (error: any) {
      console.error(`❌ Erreur réclamation NFT Fidélité:`, error);
      
      let errorMessage = error.message || 'Erreur inattendue';
      
      // Messages d'erreur spécifiques
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejetée par l\'utilisateur';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Fonds insuffisants pour les frais de gas';
      } else if (error.message?.includes('already claimed')) {
        errorMessage = 'NFT Fidélité déjà réclamé';
      } else if (error.message?.includes('not eligible')) {
        errorMessage = 'Non éligible pour la réclamation';
      }
      
      const errorResult: FidelityNFTResult = {
        success: false,
        error: errorMessage
      };

      setFidelityData(prev => ({ 
        ...prev, 
        claiming: false,
        error: errorResult.error,
        lastClaimResult: errorResult
      }));
      
      return errorResult;
    }
  }, [walletAddress, fidelityData.isFidel, fidelityData.hasClaimedNFT, fidelityData.actuallyOwnsNFT, fidelityData.inconsistencyDetected, checkFidelity]);

  // Fonction de synchronisation
  const syncStatus = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false;
    
    try {
      setFidelityData(prev => ({ ...prev, loading: true }));
      await checkFidelity();
      return true;
    } catch (error: any) {
      console.error('❌ Erreur synchronisation:', error);
      setFidelityData(prev => ({ 
        ...prev, 
        loading: false,
        error: error.message || 'Erreur de synchronisation' 
      }));
      return false;
    }
  }, [walletAddress, checkFidelity]);

  // Fonction de rechargement
  const reloadStatus = useCallback(async (): Promise<void> => {
    await checkFidelity();
  }, [checkFidelity]);

  // Fonction pour vérifier l'éligibilité
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
        reason: 'NFT Fidélité déjà possédé sur la blockchain' 
      };
    }

    if (fidelityData.hasClaimedNFT && !fidelityData.inconsistencyDetected) {
      return { 
        canClaim: false, 
        reason: 'NFT Fidélité déjà réclamé' 
      };
    }

    if (fidelityData.fidelityNFT && fidelityData.fidelityNFT.remaining <= 0) {
      return { 
        canClaim: false, 
        reason: 'Stock NFT Fidélité épuisé' 
      };
    }

    return { canClaim: true };
  }, [fidelityData.isFidel, fidelityData.actuallyOwnsNFT, fidelityData.hasClaimedNFT, fidelityData.inconsistencyDetected, fidelityData.fidelityNFT]);

  // Messages de statut
  const getStatusMessage = useCallback((): string => {
    const messages = getFidelityMessages();
    
    if (fidelityData.loading) return 'Vérification en cours...';
    if (fidelityData.claiming) return 'Réclamation en cours sur la blockchain...';
    if (fidelityData.error) return `Erreur: ${fidelityData.error}`;
    
    if (!fidelityData.isFidel) return messages.notEligible;
    
    if (fidelityData.inconsistencyDetected) {
      return 'Synchronisation requise - données incohérentes';
    }
    
    if (fidelityData.actuallyOwnsNFT) return messages.owned;
    
    if (fidelityData.hasClaimedNFT) return messages.claimed;
    
    if (fidelityData.fidelityNFT && fidelityData.fidelityNFT.remaining <= 0) {
      return 'Stock NFT Fidélité épuisé';
    }
    
    return messages.eligible;
  }, [fidelityData.loading, fidelityData.claiming, fidelityData.error, fidelityData.isFidel, fidelityData.inconsistencyDetected, fidelityData.actuallyOwnsNFT, fidelityData.hasClaimedNFT, fidelityData.fidelityNFT]);

  // Validation de l'environnement blockchain
  const validateBlockchainEnvironment = useCallback(async () => {
    try {
      const extensibleNFTService = (await import('../services/NFTService')).default;
      const validation = extensibleNFTService.validateConfiguration();
      
      return {
        valid: validation.valid,
        issues: validation.issues || [],
        recommendations: validation.warnings || []
      };
    } catch (error) {
      return {
        valid: false,
        issues: ['Impossible de charger NFTService'],
        recommendations: ['Vérifier la configuration NFTService']
      };
    }
  }, []);

  return { 
    ...fidelityData, 
    syncStatus,
    reloadStatus,
    claimMyFidelityNFT,
    checkEligibility,
    getStatusMessage,
    validateBlockchainEnvironment,
    fidelityNFTConfig: FIDELITY_NFT_CONFIG
  };
};