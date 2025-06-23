// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// =============================================
// CONFIGURATION SUPABASE POUR VITE
// =============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes dans .env');
}

// Client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// UTILITAIRES D'ACCÈS AUX DONNÉES
// =============================================

export class CryptocaVaultDB {
  
  // =================== PRÉ-APPROBATIONS ===================
  
  static async checkPreApproval(walletAddress: string) {
    const { data, error } = await supabase
      .from('pre_approved_users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('used', false)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw new Error(`Erreur vérification pré-approbation: ${error.message}`);
    }

    return data;
  }

  static async markPreApprovalUsed(walletAddress: string) {
    const { error } = await supabase
      .from('pre_approved_users')
      .update({ used: true })
      .eq('wallet_address', walletAddress.toLowerCase());

    if (error) {
      throw new Error(`Erreur marquage pré-approbation: ${error.message}`);
    }
  }

  // =================== MEMBRES COMMUNAUTÉ ===================

  static async getCommunityMember(walletAddress: string) {
    const { data, error } = await supabase
      .from('community_members')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur récupération membre: ${error.message}`);
    }

    return data;
  }

  static async createCommunityMember(memberData: {
    wallet_address: string;
    username: string;
    email: string;
    phone?: string;
    acceptance_ip?: string;
  }) {
    const { data, error } = await supabase
      .from('community_members')
      .insert([{
        ...memberData,
        wallet_address: memberData.wallet_address.toLowerCase(),
        charter_accepted: true,
        charter_version: '1.0',
        acceptance_timestamp: new Date().toISOString(),
        status: 'pending_nft_mint'
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création membre: ${error.message}`);
    }

    return data;
  }

  // =================== WALLETS AUTORISÉS ===================

  static async checkWalletAuthorization(walletAddress: string) {
    const { data, error } = await supabase
      .from('authorized_wallets')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur vérification autorisation: ${error.message}`);
    }

    return data;
  }

  // =================== ACCEPTATIONS LÉGALES ===================

  static async getLatestLegalAcceptance(walletAddress: string) {
    const { data, error } = await supabase
      .from('platform_legal_acceptances')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('is_current', true)
      .order('acceptance_date', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Erreur récupération acceptation légale: ${error.message}`);
    }

    return data?.[0] || null;
  }

  static async createLegalAcceptance(acceptanceData: {
    wallet_address: string;
    terms_accepted: boolean;
    privacy_accepted: boolean;
    risks_accepted: boolean;
    no_guarantee_understood: boolean;
    loss_risk_accepted: boolean;
    final_confirmation: boolean;
    acceptance_ip?: string;
    user_agent?: string;
    acceptance_hash: string;
  }) {
    // Marquer les anciennes acceptations comme non-courantes
    await supabase
      .from('platform_legal_acceptances')
      .update({ is_current: false })
      .eq('wallet_address', acceptanceData.wallet_address.toLowerCase());

    // Créer la nouvelle acceptation
    const { data, error } = await supabase
      .from('platform_legal_acceptances')
      .insert([{
        ...acceptanceData,
        wallet_address: acceptanceData.wallet_address.toLowerCase(),
        acceptance_date: new Date().toISOString(),
        terms_version: '1.0',
        privacy_version: '1.0',
        risks_version: '1.0',
        is_current: true
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création acceptation légale: ${error.message}`);
    }

    return data;
  }

  static async isLegalAcceptanceRecent(walletAddress: string, maxDays: number = 90) {
    const acceptance = await this.getLatestLegalAcceptance(walletAddress);
    
    if (!acceptance) return false;

    const acceptanceDate = new Date(acceptance.acceptance_date);
    const now = new Date();
    const diffDays = (now.getTime() - acceptanceDate.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays <= maxDays;
  }

  // =================== LOGS D'AUDIT ===================

  static async createAuditLog(logData: {
    action: string;
    wallet_address: string;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }) {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        ...logData,
        wallet_address: logData.wallet_address.toLowerCase(),
        timestamp: new Date().toISOString(),
        details: logData.details ? JSON.stringify(logData.details) : null
      }]);

    if (error) {
      console.error('Erreur création audit log:', error);
      // Ne pas faire échouer l'opération principale pour les logs
    }
  }

  // =================== VÉRIFICATIONS COMPLÈTES ===================

  static async getCompleteUserStatus(walletAddress: string) {
    const [
      preApproval,
      communityMember, 
      walletAuth,
      legalAcceptance
    ] = await Promise.all([
      this.checkPreApproval(walletAddress).catch(() => null),
      this.getCommunityMember(walletAddress).catch(() => null),
      this.checkWalletAuthorization(walletAddress).catch(() => null),
      this.getLatestLegalAcceptance(walletAddress).catch(() => null)
    ]);

    const hasRecentLegalAcceptance = await this.isLegalAcceptanceRecent(walletAddress).catch(() => false);

    return {
      walletAddress: walletAddress.toLowerCase(),
      isPreApproved: !!preApproval && !preApproval.used,
      isCommunityMember: !!communityMember && communityMember.status === 'active',
      isPlatformAuthorized: !!walletAuth && walletAuth.status === 'active',
      hasRecentLegalAcceptance,
      memberStatus: communityMember?.status || null,
      authorizationStatus: walletAuth?.status || null,
      lastLegalAcceptance: legalAcceptance,
      communityMemberData: communityMember,
      authorizationData: walletAuth,
      preApprovalData: preApproval
    };
  }
}

// Export par défaut
export default {
  supabase,
  CryptocaVaultDB
};