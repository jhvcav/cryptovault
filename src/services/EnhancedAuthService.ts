// src/services/EnhancedAuthService.ts
import { CryptocaVaultDB } from '../lib/supabase';
import HybridAuthService, { AuthResult } from './HybridAuthService';

// Types étendus
export interface EnhancedAuthResult extends AuthResult {
  isCommunityMember?: boolean;
  hasRecentLegalAcceptance?: boolean;
  communityStatus?: 'pending' | 'active' | 'suspended' | 'excluded' | null;
  nftData?: any;
  lastLegalAcceptance?: any;
  accessLevel?: 'none' | 'community' | 'platform' | 'full';
}

export interface UserAccessStatus {
  walletAddress: string;
  isPreApproved: boolean;
  isCommunityMember: boolean;
  isPlatformAuthorized: boolean;
  hasRecentLegalAcceptance: boolean;
  accessLevel: 'none' | 'community' | 'platform' | 'full';
  communityData?: any;
  authorizationData?: any;
  legalAcceptanceData?: any;
  nftData?: any[];
  nextSteps: string[];
  canAccessDashboard: boolean;
}

class EnhancedAuthService {
  
  // =================== VÉRIFICATIONS DE BASE ===================
  
  /**
   * Vérifier si un wallet est pré-approuvé pour rejoindre la communauté
   */
  static async checkPreApproval(walletAddress: string): Promise<boolean> {
    try {
      const data = await CryptocaVaultDB.checkPreApproval(walletAddress);
      return !!data;
    } catch (error) {
      console.error('Erreur vérification pré-approbation:', error);
      return false;
    }
  }

  /**
   * Vérifier le statut de membre de la communauté
   */
  static async checkCommunityMembership(walletAddress: string): Promise<{
    isMember: boolean;
    status: string | null;
    data: any | null;
  }> {
    try {
      const data = await CryptocaVaultDB.getCommunityMember(walletAddress);
      return {
        isMember: !!data,
        status: data?.status || null,
        data: data
      };
    } catch (error) {
      return {
        isMember: false,
        status: null,
        data: null
      };
    }
  }

  /**
   * Vérifier l'autorisation d'accès à la plateforme
   */
  static async checkPlatformAuthorization(walletAddress: string): Promise<{
    isAuthorized: boolean;
    data: any | null;
  }> {
    try {
      // Utiliser d'abord votre service existant
      const existingAuth = await HybridAuthService.checkWalletAccess(walletAddress);
      
      if (existingAuth.isAuthorized && existingAuth.isActive) {
        return {
          isAuthorized: true,
          data: existingAuth
        };
      }

      // Vérifier aussi dans votre table users_authorized
      const { data } = await CryptocaVaultDB.checkWalletAuthorization(walletAddress);

      return {
        isAuthorized: !!data,
        data: data
      };
    } catch (error) {
      console.error('Erreur vérification autorisation plateforme:', error);
      return {
        isAuthorized: false,
        data: null
      };
    }
  }

  /**
   * Vérifier l'acceptation légale récente
   */
  static async checkLegalAcceptance(walletAddress: string, maxDays: number = 90): Promise<{
    hasRecentAcceptance: boolean;
    data: any | null;
    isExpired: boolean;
  }> {
    try {
      const { data } = await supabase
        .from('platform_legal_acceptances')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('is_current', true)
        .order('acceptance_date', { ascending: false })
        .limit(1);

      const acceptanceData = data?.[0] || null;
      
      if (!acceptanceData) {
        return {
          hasRecentAcceptance: false,
          data: null,
          isExpired: false
        };
      }

      const acceptanceDate = new Date(acceptanceData.acceptance_date);
      const now = new Date();
      const diffDays = (now.getTime() - acceptanceDate.getTime()) / (1000 * 60 * 60 * 24);
      const hasRecentAcceptance = diffDays <= maxDays;

      return {
        hasRecentAcceptance,
        data: acceptanceData,
        isExpired: diffDays > maxDays
      };
    } catch (error) {
      console.error('Erreur vérification acceptation légale:', error);
      return {
        hasRecentAcceptance: false,
        data: null,
        isExpired: false
      };
    }
  }

  /**
   * Récupérer les NFT associés au wallet
   */
  static async getUserNFTs(walletAddress: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('nft_issuances')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('status', 'active')
        .order('mint_date', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Erreur récupération NFT:', error);
      return [];
    }
  }

  // =================== VÉRIFICATION COMPLÈTE ===================

  /**
   * Obtenir le statut d'accès complet d'un utilisateur
   */
  static async getCompleteUserAccessStatus(walletAddress: string): Promise<UserAccessStatus> {
    try {
      // Exécuter toutes les vérifications en parallèle
      const [
        isPreApproved,
        communityCheck,
        platformCheck,
        legalCheck,
        nftData
      ] = await Promise.all([
        this.checkPreApproval(walletAddress),
        this.checkCommunityMembership(walletAddress),
        this.checkPlatformAuthorization(walletAddress),
        this.checkLegalAcceptance(walletAddress),
        this.getUserNFTs(walletAddress)
      ]);

      // Déterminer le niveau d'accès
      let accessLevel: 'none' | 'community' | 'platform' | 'full' = 'none';
      let nextSteps: string[] = [];
      let canAccessDashboard = false;

      if (!communityCheck.isMember) {
        if (isPreApproved) {
          accessLevel = 'none';
          nextSteps.push('Compléter l\'inscription à la communauté');
        } else {
          nextSteps.push('Obtenir une pré-approbation de l\'administrateur');
        }
      } else if (communityCheck.status !== 'active') {
        accessLevel = 'none';
        nextSteps.push('Attendre l\'activation de votre compte communauté');
      } else if (!platformCheck.isAuthorized) {
        accessLevel = 'community';
        nextSteps.push('Obtenir l\'autorisation d\'accès à la plateforme');
      } else if (!legalCheck.hasRecentAcceptance) {
        accessLevel = 'platform';
        nextSteps.push('Accepter les conditions légales de la plateforme');
      } else {
        accessLevel = 'full';
        canAccessDashboard = true;
        nextSteps.push('Accès complet autorisé');
      }

      return {
        walletAddress: walletAddress.toLowerCase(),
        isPreApproved,
        isCommunityMember: communityCheck.isMember,
        isPlatformAuthorized: platformCheck.isAuthorized,
        hasRecentLegalAcceptance: legalCheck.hasRecentAcceptance,
        accessLevel,
        communityData: communityCheck.data,
        authorizationData: platformCheck.data,
        legalAcceptanceData: legalCheck.data,
        nftData,
        nextSteps,
        canAccessDashboard
      };

    } catch (error) {
      console.error('Erreur vérification statut utilisateur complet:', error);
      return {
        walletAddress: walletAddress.toLowerCase(),
        isPreApproved: false,
        isCommunityMember: false,
        isPlatformAuthorized: false,
        hasRecentLegalAcceptance: false,
        accessLevel: 'none',
        nextSteps: ['Erreur de vérification - Contactez le support'],
        canAccessDashboard: false
      };
    }
  }

  /**
   * Version étendue de votre méthode existante checkWalletAccess
   */
  static async checkWalletAccessEnhanced(walletAddress: string): Promise<EnhancedAuthResult> {
    try {
      // Utiliser d'abord votre service existant
      const baseAuth = await HybridAuthService.checkWalletAccess(walletAddress);
      
      // Ajouter les vérifications étendues
      const [communityCheck, legalCheck, nftData] = await Promise.all([
        this.checkCommunityMembership(walletAddress),
        this.checkLegalAcceptance(walletAddress),
        this.getUserNFTs(walletAddress)
      ]);

      // Déterminer le niveau d'accès
      let accessLevel: 'none' | 'community' | 'platform' | 'full' = 'none';
      
      if (baseAuth.isAuthorized && baseAuth.isActive) {
        if (legalCheck.hasRecentAcceptance) {
          accessLevel = 'full';
        } else {
          accessLevel = 'platform';
        }
      } else if (communityCheck.isMember && communityCheck.status === 'active') {
        accessLevel = 'community';
      }

      return {
        ...baseAuth,
        isCommunityMember: communityCheck.isMember,
        hasRecentLegalAcceptance: legalCheck.hasRecentAcceptance,
        communityStatus: communityCheck.status as any,
        nftData,
        lastLegalAcceptance: legalCheck.data,
        accessLevel
      };

    } catch (error) {
      console.error('Erreur vérification accès étendu:', error);
      return {
        isAuthorized: false,
        firstName: '',
        lastName: '',
        walletAddress: walletAddress.toLowerCase(),
        isActive: false,
        isCommunityMember: false,
        hasRecentLegalAcceptance: false,
        accessLevel: 'none'
      };
    }
  }

  // =================== ACTIONS UTILISATEUR ===================

  /**
   * Enregistrer un nouveau membre de la communauté
   */
  static async registerCommunityMember(data: {
    walletAddress: string;
    username: string;
    email: string;
    phone?: string;
    acceptanceIP?: string;
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Vérifier la pré-approbation
      const isPreApproved = await this.checkPreApproval(data.walletAddress);
      if (!isPreApproved) {
        return {
          success: false,
          error: 'Wallet non pré-approuvé'
        };
      }

      // Vérifier si déjà membre
      const communityCheck = await this.checkCommunityMembership(data.walletAddress);
      if (communityCheck.isMember) {
        return {
          success: false,
          error: 'Déjà membre de la communauté'
        };
      }

      // Créer le membre
      const memberData = {
        wallet_address: data.walletAddress.toLowerCase(),
        username: data.username.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        charter_accepted: true,
        charter_version: '1.0',
        acceptance_timestamp: new Date().toISOString(),
        acceptance_ip: data.acceptanceIP,
        status: 'pending_nft_mint'
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('community_members')
        .insert([memberData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Marquer la pré-approbation comme utilisée
      await supabase
        .from('pre_approved_users')
        .update({ used: true })
        .eq('wallet_address', data.walletAddress.toLowerCase());

      // Log d'audit
      await supabase.from('audit_logs').insert([{
        action: 'community_registration',
        wallet_address: data.walletAddress.toLowerCase(),
        timestamp: new Date().toISOString(),
        details: JSON.stringify({ username: data.username }),
        ip_address: data.acceptanceIP
      }]);

      return {
        success: true,
        data: insertedData
      };

    } catch (error: any) {
      console.error('Erreur enregistrement membre communauté:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  /**
   * Enregistrer une acceptation légale
   */
  static async recordLegalAcceptance(data: {
    walletAddress: string;
    formData: any;
    acceptanceIP?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; error?: string; hash?: string }> {
    try {
      // Vérifier les prérequis
      const status = await this.getCompleteUserAccessStatus(data.walletAddress);
      if (!status.isCommunityMember || !status.isPlatformAuthorized) {
        return {
          success: false,
          error: 'Prérequis non remplis pour l\'acceptation légale'
        };
      }

      // Générer le hash
      const dataToHash = JSON.stringify({
        wallet: data.walletAddress.toLowerCase(),
        timestamp: Date.now(),
        acceptances: data.formData
      });
      
      const msgBuffer = new TextEncoder().encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const acceptanceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Marquer les anciennes acceptations comme non-courantes
      await supabase
        .from('platform_legal_acceptances')
        .update({ is_current: false })
        .eq('wallet_address', data.walletAddress.toLowerCase());

      // Créer la nouvelle acceptation
      const acceptanceRecord = {
        wallet_address: data.walletAddress.toLowerCase(),
        terms_accepted: data.formData.termsAccepted,
        privacy_accepted: data.formData.privacyAccepted,
        risks_accepted: data.formData.risksAccepted,
        no_guarantee_understood: data.formData.noGuaranteeUnderstood,
        loss_risk_accepted: data.formData.lossRiskAccepted,
        final_confirmation: data.formData.finalConfirmation,
        acceptance_date: new Date().toISOString(),
        acceptance_ip: data.acceptanceIP,
        user_agent: data.userAgent,
        terms_version: '1.0',
        privacy_version: '1.0',
        risks_version: '1.0',
        acceptance_hash: acceptanceHash,
        is_current: true
      };

      const { error: insertError } = await supabase
        .from('platform_legal_acceptances')
        .insert([acceptanceRecord]);

      if (insertError) {
        throw insertError;
      }

      // Log d'audit
      await supabase.from('audit_logs').insert([{
        action: 'legal_acceptance',
        wallet_address: data.walletAddress.toLowerCase(),
        timestamp: new Date().toISOString(),
        details: JSON.stringify({ acceptanceHash }),
        ip_address: data.acceptanceIP
      }]);

      return {
        success: true,
        hash: acceptanceHash
      };

    } catch (error: any) {
      console.error('Erreur enregistrement acceptation légale:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }

  // =================== INTÉGRATION AVEC VOTRE SYSTÈME EXISTANT ===================

  /**
   * Méthode pour intégrer avec votre AuthContext existant
   */
  static async login(walletAddress: string): Promise<boolean> {
    try {
      // Utiliser la vérification étendue
      const authResult = await this.checkWalletAccessEnhanced(walletAddress);
      
      // Pour le login, on accepte l'accès si:
      // 1. L'utilisateur est autorisé dans votre système existant ET
      // 2. Il a accepté les conditions légales récemment
      return authResult.isAuthorized && 
             authResult.isActive && 
             authResult.hasRecentLegalAcceptance;
      
    } catch (error) {
      console.error('Erreur login étendu:', error);
      return false;
    }
  }

  /**
   * Middleware pour vérifier l'accès aux routes protégées
   */
  static async canAccessRoute(
    walletAddress: string, 
    requiredLevel: 'community' | 'platform' | 'full'
  ): Promise<boolean> {
    try {
      const status = await this.getCompleteUserAccessStatus(walletAddress);
      
      const levelHierarchy = {
        'community': 1,
        'platform': 2,
        'full': 3
      };

      const userLevel = levelHierarchy[status.accessLevel] || 0;
      const requiredLevelValue = levelHierarchy[requiredLevel];

      return userLevel >= requiredLevelValue;
      
    } catch (error) {
      console.error('Erreur vérification accès route:', error);
      return false;
    }
  }
}

export default EnhancedAuthService;