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
          fidelity_nft_claimed_date
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
        userType: 'MemberSimple', // Valeur par défaut, à adapter selon votre logique
        userTypeId: 1 // Valeur par défaut, à adapter selon votre logique
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
            fidelity_nft_claimed: false
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
      // TODO: Implémenter la logique de type d'utilisateur si vous avez une table séparée
      console.log('🔄 Mise à jour type utilisateur (stub):', walletAddress, userTypeId);
      
      // Pour l'instant, retourner true car cette fonctionnalité n'est pas encore implémentée
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
      // TODO: Implémenter la récupération des types depuis une table dédiée
      // Pour l'instant, retourner des types par défaut
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
          typeName: 'Admin',
          description: 'Administrateur',
          permissions: { canInvest: true, canWithdraw: true, canManageUsers: true }
        }
      ];

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des types:', error);
      return [];
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