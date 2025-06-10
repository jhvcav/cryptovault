// src/services/HybridAuthService.ts
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces
export interface AuthResult {
  isAuthorized: boolean;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  fidelityStatus?: 'OUI' | 'NON';
  walletAddress?: string;
}

export interface UserData {
  walletAddress: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  fidelityStatus: 'OUI' | 'NON';
  fidelityNftClaimed?: boolean;
  userType: string;
  userTypeId: number;
}

export interface UserType {
  id: number;
  typeName: string;
  description: string;
  permissions: Record<string, boolean>;
}

export interface Investment {
  id: string;
  investmentType: string;
  aprRate: number;
  amountInvested: number;
  startDate: string;
  endDate: string;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
}

class HybridAuthService {
  constructor() {
    // Debug des variables d'environnement
    console.log('🔍 HybridAuthService - Configuration Supabase:', {
      url: supabaseUrl ? 'PRESENT' : 'MISSING',
      key: supabaseKey ? 'PRESENT' : 'MISSING'
    });
  }

  /**
   * Vérifie si une adresse wallet est autorisée à accéder à la plateforme
   */
  async checkWalletAccess(walletAddress: string): Promise<AuthResult> {
    try {
      // Validation de l'adresse
      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
        console.log('❌ Format d\'adresse invalide:', walletAddress);
        return { isAuthorized: false };
      }

      // Normaliser l'adresse en minuscules pour la comparaison
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔍 Recherche utilisateur pour:', normalizedAddress);

      const { data, error } = await supabase
        .from('users_authorized')
        .select(`
          wallet_address,
          first_name,
          last_name,
          status,
          fidelity_status,
          fidelity_nft_claimed
        `)
        .eq('wallet_address', normalizedAddress)
        .single();

      if (error) {
        console.log('❌ Erreur Supabase ou utilisateur non trouvé:', error.message);
        return { isAuthorized: false };
      }

      if (!data) {
        console.log('❌ Aucun utilisateur trouvé pour:', normalizedAddress);
        return { isAuthorized: false };
      }

      console.log('✅ Utilisateur trouvé:', {
        firstName: data.first_name,
        lastName: data.last_name,
        status: data.status,
        fidelityStatus: data.fidelity_status,
        fidelityNftClaimed: data.fidelity_nft_claimed
      });

      return {
        isAuthorized: true,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        isActive: data.status === 'Active',
        fidelityStatus: data.fidelity_status || 'NON',
        walletAddress: data.wallet_address || normalizedAddress,
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification wallet:', error);
      return { isAuthorized: false };
    }
  }

  /**
   * Récupère tous les utilisateurs autorisés (fonction admin)
   */
  async getAllUsers(): Promise<UserData[]> {
  try {
    console.log('🔍 Récupération de tous les utilisateurs...');
    
    const { data, error } = await supabase
      .from('users_authorized')
      .select(`
        wallet_address,
        first_name,
        last_name,
        registration_date,
        status,
        fidelity_status,
        fidelity_nft_claimed,
        fidelity_nft_claimed_date,
        user_type_id,
        user_types!inner(
          id,
          type_name,
          description
        )
      `)
      .order('registration_date', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase getAllUsers:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ Aucune donnée retournée');
      return [];
    }

    console.log(`✅ ${data.length} utilisateurs récupérés`);

    return data.map((record: any) => ({
      walletAddress: record.wallet_address || '',
      firstName: record.first_name || '',
      lastName: record.last_name || '',
      registrationDate: record.registration_date || '',
      status: record.status || 'Inactive',
      fidelityStatus: record.fidelity_status || 'NON',
      fidelityNftClaimed: record.fidelity_nft_claimed || false,
      userType: record.user_types?.type_name || 'MemberSimple',
      userTypeId: record.user_type_id || 1
    }));

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
}

  /**
   * Ajoute un nouvel utilisateur autorisé
   */
  async addAuthorizedUser(
  walletAddress: string, 
  firstName: string, 
  lastName: string, 
  userTypeId: number = 1
): Promise<boolean> {
  try {
    // Validation des données
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      throw new Error('Format d\'adresse wallet invalide');
    }

    if (!firstName.trim() || !lastName.trim()) {
      throw new Error('Prénom et nom requis');
    }

    // Vérifier que le type d'utilisateur existe
    const { data: typeExists, error: typeError } = await supabase
      .from('user_types')
      .select('id')
      .eq('id', userTypeId)
      .single();

    if (typeError || !typeExists) {
      console.error('❌ Type d\'utilisateur inexistant:', userTypeId);
      userTypeId = 1; // Fallback vers MemberSimple
    }

    const normalizedAddress = walletAddress.toLowerCase();
    console.log('➕ Ajout utilisateur:', normalizedAddress);

    const { data, error } = await supabase
      .from('users_authorized')
      .insert([
        {
          wallet_address: normalizedAddress,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Active',
          fidelity_status: 'NON',
          fidelity_nft_claimed: false,
          user_type_id: userTypeId
        }
      ])
      .select();

    if (error) {
      console.error('❌ Erreur lors de l\'ajout:', error);
      return false;
    }

    console.log('✅ Utilisateur ajouté avec succès:', data);
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout utilisateur:', error);
    return false;
  }
}

  /**
 * Met à jour les informations personnelles d'un utilisateur (prénom, nom)
 */
async updateUserPersonalInfo(
  walletAddress: string,
  firstName: string,
  lastName: string
): Promise<boolean> {
  try {
    // Validation des données
    if (!firstName.trim() || !lastName.trim()) {
      throw new Error('Prénom et nom requis');
    }

    const normalizedAddress = walletAddress.toLowerCase();
    console.log('🔄 Mise à jour infos personnelles pour:', normalizedAddress);

    const { error } = await supabase
      .from('users_authorized')
      .update({ 
        first_name: firstName.trim(),
        last_name: lastName.trim()
      })
      .eq('wallet_address', normalizedAddress);

    if (error) {
      console.error('❌ Erreur mise à jour infos personnelles:', error);
      return false;
    }

    console.log('✅ Informations personnelles mises à jour avec succès');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des infos personnelles:', error);
    return false;
  }
}

  /**
 * Met à jour l'adresse wallet d'un utilisateur (ATTENTION: opération sensible)
 */
async updateUserWalletAddress(
  oldWalletAddress: string,
  newWalletAddress: string
): Promise<boolean> {
  try {
    // Validation du format de la nouvelle adresse
    if (!newWalletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      throw new Error('Format de nouvelle adresse wallet invalide');
    }

    const oldNormalizedAddress = oldWalletAddress.toLowerCase();
    const newNormalizedAddress = newWalletAddress.toLowerCase();
    
    console.log('🔄 Mise à jour adresse wallet:', oldNormalizedAddress, '->', newNormalizedAddress);

    // Vérifier que la nouvelle adresse n'est pas déjà utilisée
    const { data: existingUser, error: checkError } = await supabase
      .from('users_authorized')
      .select('wallet_address')
      .eq('wallet_address', newNormalizedAddress)
      .single();

    if (existingUser && !checkError) {
      console.error('❌ La nouvelle adresse wallet est déjà utilisée');
      return false;
    }

    // Mettre à jour l'adresse wallet
    const { error } = await supabase
      .from('users_authorized')
      .update({ wallet_address: newNormalizedAddress })
      .eq('wallet_address', oldNormalizedAddress);

    if (error) {
      console.error('❌ Erreur mise à jour adresse wallet:', error);
      return false;
    }

    console.log('✅ Adresse wallet mise à jour avec succès');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'adresse wallet:', error);
    return false;
  }
}

  /**
 * Met à jour tous les champs d'un utilisateur en une seule opération
 */
async updateUserComplete(
  oldWalletAddress: string,
  userData: {
    walletAddress?: string;
    firstName: string;
    lastName: string;
    status: 'Active' | 'Suspended' | 'Inactive';
    fidelityStatus: 'OUI' | 'NON';
    userTypeId: number;
  }
): Promise<boolean> {
  try {
    const oldNormalizedAddress = oldWalletAddress.toLowerCase();
    console.log('🔄 Mise à jour complète utilisateur:', oldNormalizedAddress);

    // Si l'adresse wallet change, d'abord vérifier qu'elle n'existe pas
    if (userData.walletAddress && userData.walletAddress !== oldWalletAddress) {
      const newNormalizedAddress = userData.walletAddress.toLowerCase();
      
      const { data: existingUser } = await supabase
        .from('users_authorized')
        .select('wallet_address')
        .eq('wallet_address', newNormalizedAddress)
        .single();

      if (existingUser) {
        console.error('❌ La nouvelle adresse wallet est déjà utilisée');
        return false;
      }
    }

    // Vérifier que le type d'utilisateur existe
    const { data: typeExists } = await supabase
      .from('user_types')
      .select('id')
      .eq('id', userData.userTypeId)
      .single();

    if (!typeExists) {
      console.error('❌ Type d\'utilisateur inexistant:', userData.userTypeId);
      return false;
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      first_name: userData.firstName.trim(),
      last_name: userData.lastName.trim(),
      status: userData.status,
      fidelity_status: userData.fidelityStatus,
      user_type_id: userData.userTypeId
    };

    // Ajouter l'adresse wallet si elle change
    if (userData.walletAddress && userData.walletAddress !== oldWalletAddress) {
      updateData.wallet_address = userData.walletAddress.toLowerCase();
    }

    // Effectuer la mise à jour
    const { error } = await supabase
      .from('users_authorized')
      .update(updateData)
      .eq('wallet_address', oldNormalizedAddress);

    if (error) {
      console.error('❌ Erreur mise à jour complète:', error);
      return false;
    }

    console.log('✅ Utilisateur mis à jour complètement avec succès');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour complète:', error);
    return false;
  }
}

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(
    walletAddress: string, 
    status: 'Active' | 'Suspended' | 'Inactive'
  ): Promise<boolean> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔄 Mise à jour statut pour:', normalizedAddress, 'vers:', status);

      const { error } = await supabase
        .from('users_authorized')
        .update({ status })
        .eq('wallet_address', normalizedAddress);

      if (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        return false;
      }

      console.log('✅ Statut mis à jour avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      return false;
    }
  }

  /**
   * Met à jour le statut de fidélité d'un utilisateur
   */
  async updateUserFidelity(
    walletAddress: string, 
    fidelityStatus: 'OUI' | 'NON'
  ): Promise<boolean> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔄 Mise à jour fidélité pour:', normalizedAddress, 'vers:', fidelityStatus);

      const { error } = await supabase
        .from('users_authorized')
        .update({ fidelity_status: fidelityStatus })
        .eq('wallet_address', normalizedAddress);

      if (error) {
        console.error('❌ Erreur mise à jour fidélité:', error);
        return false;
      }

      console.log('✅ Fidélité mise à jour avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour fidélité:', error);
      return false;
    }
  }

  /**
   * Marque un NFT de fidélité comme réclamé
   */
  async markFidelityNFTClaimed(walletAddress: string): Promise<boolean> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🎁 Marquage NFT fidélité réclamé pour:', normalizedAddress);

      const { error } = await supabase
        .from('users_authorized')
        .update({ 
          fidelity_nft_claimed: true,
          fidelity_nft_claimed_date: new Date().toISOString()
        })
        .eq('wallet_address', normalizedAddress);

      if (error) {
        console.error('❌ Erreur marquage NFT fidélité:', error);
        return false;
      }

      console.log('✅ NFT fidélité marqué comme réclamé');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors du marquage NFT fidélité:', error);
      return false;
    }
  }

  /**
   * Met à jour le type d'utilisateur (stub - à implémenter selon vos besoins)
   */
  async updateUserType(walletAddress: string, userTypeId: number): Promise<boolean> {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    console.log('🔄 Mise à jour type utilisateur pour:', normalizedAddress, 'vers:', userTypeId);

    // Vérifier que le type d'utilisateur existe
    const { data: typeExists, error: typeError } = await supabase
      .from('user_types')
      .select('id')
      .eq('id', userTypeId)
      .single();

    if (typeError || !typeExists) {
      console.error('❌ Type d\'utilisateur inexistant:', userTypeId);
      return false;
    }

    // Mettre à jour le type d'utilisateur
    const { error } = await supabase
      .from('users_authorized')
      .update({ user_type_id: userTypeId })
      .eq('wallet_address', normalizedAddress);

    if (error) {
      console.error('❌ Erreur mise à jour type utilisateur:', error);
      return false;
    }

    console.log('✅ Type utilisateur mis à jour avec succès');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du type:', error);
    return false;
  }
}

  /**
   * Récupère les types d'utilisateurs (stub - à implémenter selon vos besoins)
   */
  async getUserTypes(): Promise<UserType[]> {
  try {
    console.log('🔍 Récupération des types d\'utilisateurs...');
    
    const { data, error } = await supabase
      .from('user_types')
      .select(`
        id,
        type_name,
        description,
        permissions
      `)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Erreur Supabase getUserTypes:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ Aucun type d\'utilisateur trouvé');
      return [];
    }

    console.log(`✅ ${data.length} types d\'utilisateurs récupérés`);

    return data.map((record: any) => ({
      id: record.id,
      typeName: record.type_name || '',
      description: record.description || '',
      permissions: record.permissions || {}
    }));

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des types:', error);
    // Fallback vers les types par défaut
    return [
      {
        id: 1,
        typeName: 'MemberSimple',
        description: 'Membre standard',
        permissions: { canInvest: true, canWithdraw: true }
      },
      {
        id: 2,
        typeName: 'MemberPrivilégié',
        description: 'Membre privilégié avec avantages',
        permissions: { canInvest: true, canWithdraw: true, hasBonus: true }
      },
      {
        id: 3,
        typeName: 'UtilisateurExterne',
        description: 'Utilisateur externe avec accès limité',
        permissions: { dashboard: true }
      },
      {
        id: 4,
        typeName: 'Admin',
        description: 'Administrateur',
        permissions: { canInvest: true, canWithdraw: true, canManageUsers: true }
      },
      {
        id: 5,
        typeName: 'Invité',
        description: 'Accès invité temporaire',
        permissions: { invest: false, dashboard: false }
      }
    ];
  }
}

  /**
   * Vérifie le statut de fidélité d'un utilisateur
   */
  async checkFidelityStatus(walletAddress: string): Promise<{
    isFidel: boolean;
    hasClaimedNFT: boolean;
    userInfo: { firstName: string; lastName: string; status: string } | null;
  }> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔍 Vérification fidélité pour:', normalizedAddress);

      const { data, error } = await supabase
        .from('users_authorized')
        .select(`
          first_name,
          last_name,
          status,
          fidelity_status,
          fidelity_nft_claimed
        `)
        .eq('wallet_address', normalizedAddress)
        .eq('status', 'Active')
        .single();

      if (error || !data) {
        console.log('❌ Utilisateur non trouvé ou inactif');
        return {
          isFidel: false,
          hasClaimedNFT: false,
          userInfo: null
        };
      }

      const result = {
        isFidel: data.fidelity_status === 'OUI',
        hasClaimedNFT: data.fidelity_nft_claimed || false,
        userInfo: {
          firstName: data.first_name,
          lastName: data.last_name,
          status: data.status
        }
      };

      console.log('✅ Statut fidélité:', result);
      return result;

    } catch (error) {
      console.error('❌ Erreur vérification fidélité:', error);
      return {
        isFidel: false,
        hasClaimedNFT: false,
        userInfo: null
      };
    }
  }

  /**
   * Enregistre un nouvel investissement pour un utilisateur
   */
  async recordInvestment(
    walletAddress: string,
    investmentType: string,
    aprRate: number,
    amountInvested: number,
    startDate: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      // Validation des données
      if (aprRate < 0 || amountInvested <= 0) {
        throw new Error('Données d\'investissement invalides');
      }

      const normalizedAddress = walletAddress.toLowerCase();
      console.log('💰 Enregistrement investissement pour:', normalizedAddress);

      // TODO: Créer une table 'investments' dans Supabase si elle n'existe pas
      const { error } = await supabase
        .from('investments')
        .insert([
          {
            wallet_address: normalizedAddress,
            investment_type: investmentType,
            apr_rate: aprRate,
            amount_invested: amountInvested,
            start_date: startDate,
            end_date: endDate || null,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Erreur enregistrement investissement:', error);
        return false;
      }

      console.log('✅ Investissement enregistré avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement investissement:', error);
      return false;
    }
  }

  /**
   * Récupère tous les investissements d'un utilisateur
   */
  async getUserInvestments(walletAddress: string): Promise<Investment[]> {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('📊 Récupération investissements pour:', normalizedAddress);

      const { data, error } = await supabase
        .from('investments')
        .select(`
          id,
          investment_type,
          apr_rate,
          amount_invested,
          start_date,
          end_date,
          daily_return,
          weekly_return,
          monthly_return
        `)
        .eq('wallet_address', normalizedAddress)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération investissements:', error);
        return [];
      }

      if (!data) {
        console.log('⚠️ Aucun investissement trouvé');
        return [];
      }

      console.log(`✅ ${data.length} investissements récupérés`);

      return data.map((record: any) => ({
        id: record.id,
        investmentType: record.investment_type || '',
        aprRate: record.apr_rate || 0,
        amountInvested: record.amount_invested || 0,
        startDate: record.start_date || '',
        endDate: record.end_date || '',
        dailyReturn: record.daily_return || 0,
        weeklyReturn: record.weekly_return || 0,
        monthlyReturn: record.monthly_return || 0,
      }));

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des investissements:', error);
      return [];
    }
  }

  /**
   * Supprime un investissement
   */
  async deleteInvestment(investmentId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression investissement:', investmentId);

      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId);

      if (error) {
        console.error('❌ Erreur suppression investissement:', error);
        return false;
      }

      console.log('✅ Investissement supprimé avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'investissement:', error);
      return false;
    }
  }

  /**
   * Met à jour un investissement existant
   */
  async updateInvestment(
    investmentId: string,
    updates: Partial<{
      investmentType: string;
      aprRate: number;
      amountInvested: number;
      endDate: string;
    }>
  ): Promise<boolean> {
    try {
      console.log('🔄 Mise à jour investissement:', investmentId, updates);

      const updateData: any = {};
      if (updates.investmentType) updateData.investment_type = updates.investmentType;
      if (updates.aprRate !== undefined) updateData.apr_rate = updates.aprRate;
      if (updates.amountInvested !== undefined) updateData.amount_invested = updates.amountInvested;
      if (updates.endDate) updateData.end_date = updates.endDate;

      const { error } = await supabase
        .from('investments')
        .update(updateData)
        .eq('id', investmentId);

      if (error) {
        console.error('❌ Erreur mise à jour investissement:', error);
        return false;
      }

      console.log('✅ Investissement mis à jour avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'investissement:', error);
      return false;
    }
  }

  /**
   * Vérifie la connectivité à Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Test de connexion Supabase...');

      const { data, error } = await supabase
        .from('users_authorized')
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Erreur de connexion Supabase:', error);
        return false;
      }

      console.log('✅ Connexion Supabase réussie');
      return true;

    } catch (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
      return false;
    }
  }
}

// Export d'une instance singleton
export default new HybridAuthService();