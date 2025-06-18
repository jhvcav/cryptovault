//src/hooks/useFidelityStatus.ts
// Hook pour vérifier le statut de fidélité d'un utilisateur et gérer les NFT associés
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import extensibleNFTService, { FidelityStatusResponse } from '../services/NFTService';
import { FIDELITY_NFT_CONFIG, getFidelityMessages } from '../config/fidelityConfig';

// ✅ Configuration Supabase directe avec vos variables d'environnement
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

  // ✅ SOLUTION DIRECTE : Interroger Supabase directement
  const checkFidelityDirectInSupabase = useCallback(async (address: string): Promise<FidelityStatusResponse> => {
    try {
      console.log(`🔍 Vérification directe Supabase pour: ${address}`);

      // ✅ Requête directe dans votre table users_authorized
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

      // Pas d'utilisateur trouvé = pas fidèle
      if (error && error.code === 'PGRST116') {
        console.log('ℹ️ Utilisateur non trouvé dans users_authorized');
        return {
          isFidel: false,
          hasClaimedNFT: false,
          actuallyOwnsNFT: false,
          highestTier: '0',
          userInfo: null
        };
      }

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(error.message);
      }

      if (!user) {
        return {
          isFidel: false,
          hasClaimedNFT: false,
          actuallyOwnsNFT: false,
          highestTier: '0',
          userInfo: null
        };
      }

      // ✅ Analyser votre structure de données
      const isFidel = user.fidelity_status === 'OUI';
      const hasClaimedNFT = user.fidelity_nft_claimed === 'true' || user.fidelity_nft_claimed === true;

      console.log('📊 Utilisateur trouvé:', {
        id: user.id,
        wallet: user.wallet_address,
        name: `${user.first_name} ${user.last_name}`,
        fidelity_status: user.fidelity_status,
        fidelity_nft_claimed: user.fidelity_nft_claimed,
        isFidel,
        hasClaimedNFT
      });

      // ✅ Construire la réponse
      return {
        isFidel,
        hasClaimedNFT,
        actuallyOwnsNFT: false, // Sera vérifié côté blockchain
        highestTier: isFidel ? (hasClaimedNFT ? '5' : '0') : '0',
        userInfo: isFidel ? {
          firstName: user.first_name || 'Utilisateur',
          lastName: user.last_name || '',
          email: `${user.first_name?.toLowerCase() || 'user'}@exemple.com`,
          claimedAt: user.fidelity_nft_claimed_date || null
        } : null,
        fidelityNFT: isFidel ? {
          tier: FIDELITY_NFT_CONFIG.tier,
          name: FIDELITY_NFT_CONFIG.name,
          supply: FIDELITY_NFT_CONFIG.supply,
          minted: hasClaimedNFT ? 1 : 0,
          remaining: hasClaimedNFT ? FIDELITY_NFT_CONFIG.supply - 1 : FIDELITY_NFT_CONFIG.supply,
          userOwns: hasClaimedNFT,
          canClaim: isFidel && !hasClaimedNFT
        } : undefined
      };

    } catch (error: any) {
      console.error('❌ Erreur vérification Supabase directe:', error);
      throw error;
    }
  }, []);

  // ✅ Fonction principale de vérification
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
      
      console.log(`🔍 Vérification fidélité ${FIDELITY_NFT_CONFIG.displayName} pour:`, walletAddress);
      
      // ✅ Vérification directe dans Supabase
      const supabaseStatus = await checkFidelityDirectInSupabase(walletAddress);
      
      // Vérifier la possession réelle du NFT sur la blockchain
      let actuallyOwnsNFT = false;
      try {
        actuallyOwnsNFT = await extensibleNFTService.userHasFidelityNFT(walletAddress);
        console.log('🔗 Vérification blockchain:', { actuallyOwnsNFT });
      } catch (blockchainError) {
        console.warn('⚠️ Erreur vérification blockchain:', blockchainError);
      }
      
      // Vérifier la cohérence
      const inconsistency = supabaseStatus.hasClaimedNFT && !actuallyOwnsNFT;
      
      setFidelityData({
        isFidel: supabaseStatus.isFidel,
        hasClaimedNFT: supabaseStatus.hasClaimedNFT,
        actuallyOwnsNFT,
        highestTier: supabaseStatus.highestTier,
        userInfo: supabaseStatus.userInfo,
        loading: false,
        inconsistencyDetected: inconsistency,
        error: undefined,
        fidelityNFT: supabaseStatus.fidelityNFT ? {
          tier: supabaseStatus.fidelityNFT.tier,
          name: supabaseStatus.fidelityNFT.name,
          canClaim: supabaseStatus.fidelityNFT.canClaim,
          supply: supabaseStatus.fidelityNFT.supply,
          remaining: supabaseStatus.fidelityNFT.remaining,
          userOwns: supabaseStatus.fidelityNFT.userOwns
        } : {
          tier: FIDELITY_NFT_CONFIG.tier,
          name: FIDELITY_NFT_CONFIG.name,
          canClaim: supabaseStatus.isFidel && !supabaseStatus.hasClaimedNFT && !actuallyOwnsNFT,
          supply: FIDELITY_NFT_CONFIG.supply,
          remaining: FIDELITY_NFT_CONFIG.supply - 1,
          userOwns: actuallyOwnsNFT
        }
      });

      // Debug spécifique pour votre cas
      if (walletAddress.toLowerCase() === '0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd') {
        console.log('🎁 DEBUG pour votre wallet:', {
          walletAddress,
          isFidel: supabaseStatus.isFidel,
          hasClaimedNFT: supabaseStatus.hasClaimedNFT,
          canClaim: supabaseStatus.isFidel && !supabaseStatus.hasClaimedNFT,
          userInfo: supabaseStatus.userInfo,
          fidelityNFT: supabaseStatus.fidelityNFT
        });
      }

      if (inconsistency) {
        console.warn(`🔄 Incohérence détectée pour ${FIDELITY_NFT_CONFIG.displayName}:`, {
          hasClaimedNFT: supabaseStatus.hasClaimedNFT,
          actuallyOwnsNFT,
          walletAddress,
          tier: FIDELITY_NFT_CONFIG.tier
        });
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
  }, [walletAddress, checkFidelityDirectInSupabase]);

  useEffect(() => {
    checkFidelity();
  }, [checkFidelity]);

  // ✅ Fonction de synchronisation (met à jour Supabase directement)
  const syncStatus = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) return false;
    
    try {
      setFidelityData(prev => ({ ...prev, loading: true }));
      
      console.log('🔄 Synchronisation du statut NFT Fidélité...');
      
      // Recharger depuis Supabase
      await checkFidelity();
      
      return true;
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

  // Fonction de rechargement
  const reloadStatus = useCallback(async (): Promise<void> => {
    await checkFidelity();
  }, [checkFidelity]);

  // ✅ Fonction de réclamation NFT Fidélité (met à jour Supabase directement)
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
      
      // Vérifier l'éligibilité
      if (!fidelityData.isFidel) {
        return {
          success: false,
          error: 'Non éligible pour la réclamation'
        };
      }

      if (fidelityData.hasClaimedNFT) {
        return {
          success: false,
          error: 'NFT Fidélité déjà réclamé'
        };
      }
      
      // ✅ Simuler la transaction blockchain (à remplacer par vraie transaction)
      const simulatedTxHash = `0x${Math.random().toString(16).substr(2, 40)}`;
      const simulatedTokenId = Math.floor(Math.random() * 1000).toString();

      // ✅ Mettre à jour Supabase directement
      const { data: updatedUser, error: updateError } = await supabase
        .from('users_authorized')
        .update({
          fidelity_nft_claimed: 'true',
          fidelity_nft_claimed_date: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('fidelity_status', 'OUI')
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur mise à jour Supabase:', updateError);
        throw new Error('Erreur mise à jour du statut de réclamation');
      }

      console.log(`✅ ${FIDELITY_NFT_CONFIG.displayName} réclamé avec succès:`, {
        wallet: walletAddress,
        txHash: simulatedTxHash,
        tokenId: simulatedTokenId,
        updatedUser
      });
      
      // Mettre à jour le statut local
      setFidelityData(prev => ({
        ...prev,
        hasClaimedNFT: true,
        actuallyOwnsNFT: true,
        userInfo: prev.userInfo ? {
          ...prev.userInfo,
          claimedAt: new Date().toISOString()
        } : null
      }));
      
      return {
        success: true,
        txHash: simulatedTxHash,
        tokenId: simulatedTokenId
      };
      
    } catch (error: any) {
      console.error(`❌ Erreur réclamation ${FIDELITY_NFT_CONFIG.displayName}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur inattendue'
      };
    }
  }, [walletAddress, fidelityData.isFidel, fidelityData.hasClaimedNFT]);

  // Fonction pour vérifier l'éligibilité NFT Fidélité
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

  // Messages de statut pour NFT Fidélité
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

  // Fonction pour obtenir des statistiques détaillées
  const getFidelityStats = useCallback(async () => {
    try {
      // ✅ Statistiques directes depuis Supabase
      const { count: totalEligible, error: eligibleError } = await supabase
        .from('users_authorized')
        .select('*', { count: 'exact', head: true })
        .eq('fidelity_status', 'OUI')
        .eq('status', 'Active');

      const { count: totalClaimed, error: claimedError } = await supabase
        .from('users_authorized')
        .select('*', { count: 'exact', head: true })
        .eq('fidelity_status', 'OUI')
        .eq('fidelity_nft_claimed', 'true')
        .eq('status', 'Active');

      if (eligibleError || claimedError) {
        throw new Error('Erreur récupération statistiques');
      }

      return {
        tier: FIDELITY_NFT_CONFIG.tier,
        name: FIDELITY_NFT_CONFIG.name,
        config: FIDELITY_NFT_CONFIG,
        usage: {
          totalEligible: totalEligible || 0,
          totalClaimed: totalClaimed || 0,
          totalPending: (totalEligible || 0) - (totalClaimed || 0),
          claimRate: totalEligible > 0 ? Math.round(((totalClaimed || 0) / totalEligible) * 100) : 0,
          supplyUtilization: Math.round(((totalClaimed || 0) / FIDELITY_NFT_CONFIG.supply) * 100)
        }
      };
    } catch (error) {
      console.error('Erreur récupération statistiques NFT Fidélité:', error);
      return {
        tier: FIDELITY_NFT_CONFIG.tier,
        name: FIDELITY_NFT_CONFIG.name,
        config: FIDELITY_NFT_CONFIG,
        usage: {
          totalEligible: 1,
          totalClaimed: 0,
          totalPending: 1,
          claimRate: 0,
          supplyUtilization: 0
        }
      };
    }
  }, []);

  // Fonction de validation de l'environnement
  const validateEnvironment = useCallback(async () => {
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          valid: false,
          issues: ['Variables Supabase manquantes'],
          recommendations: ['Ajouter VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env']
        };
      }

      // Test de connexion à Supabase
      const { count, error } = await supabase
        .from('users_authorized')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        return {
          valid: false,
          issues: ['Connexion Supabase échouée'],
          recommendations: ['Vérifier les clés Supabase', 'Vérifier les permissions RLS']
        };
      }

      return {
        valid: true,
        issues: [],
        recommendations: ['Configuration Supabase directe OK']
      };
    } catch (error) {
      console.error('Erreur validation environnement NFT Fidélité:', error);
      return {
        valid: false,
        issues: ['Erreur de validation'],
        recommendations: ['Vérifier la configuration Supabase']
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
    getFidelityStats,
    validateEnvironment,
    fidelityNFTConfig: FIDELITY_NFT_CONFIG
  };
};