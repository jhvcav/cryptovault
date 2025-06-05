// src/services/HybridAuthService.ts
import LocalAuthService from './LocalAuthService';
import SupabaseAuthService from './SupabaseAuthService';
import { AuthResult } from './LocalAuthService';

type AuthMode = 'local' | 'supabase' | 'auto';

class HybridAuthService {
  private mode: AuthMode = 'auto'; // Mode par défaut

  /**
   * Définit le mode d'authentification
   */
  setMode(mode: AuthMode) {
    this.mode = mode;
    console.log(`🔄 Mode d'authentification changé vers: ${mode}`);
  }

  /**
   * Détermine automatiquement quel service utiliser
   */
  private async getActiveService() {
    if (this.mode === 'local') {
      console.log('🏠 Utilisation du service local (forcé)');
      return LocalAuthService;
    }
    
    if (this.mode === 'supabase') {
      console.log('☁️ Utilisation de Supabase (forcé)');
      return SupabaseAuthService;
    }

    // Mode auto : teste Supabase, sinon fallback local
    if (SupabaseAuthService.isConfigured()) {
      try {
        const isConnected = await SupabaseAuthService.testConnection();
        if (isConnected) {
          console.log('☁️ Utilisation de Supabase (auto-détecté)');
          return SupabaseAuthService;
        }
      } catch (error) {
        console.warn('⚠️ Supabase indisponible, fallback vers local');
      }
    }

    console.log('🏠 Utilisation du service local (fallback)');
    return LocalAuthService;
  }

  /**
   * Vérifie si une adresse wallet est autorisée
   */
  async checkWalletAccess(walletAddress: string): Promise<AuthResult> {
    const service = await this.getActiveService();
    return service.checkWalletAccess(walletAddress);
  }

  /**
   * Ajoute un nouvel utilisateur autorisé
   */
  async addAuthorizedUser(walletAddress: string, firstName: string, lastName: string, userTypeId: number = 1): Promise<boolean> {
    const service = await this.getActiveService();
    if (service === SupabaseAuthService) {
      return service.addAuthorizedUser(walletAddress, firstName, lastName, userTypeId);
    }
    return service.addAuthorizedUser(walletAddress, firstName, lastName);
  }

  /**
   * Récupère tous les types d'utilisateurs
   */
  async getUserTypes() {
    const service = await this.getActiveService();
    if (service === SupabaseAuthService) {
      return service.getUserTypes();
    }
    // Fallback local pour les types
    return [
      { id: 1, typeName: 'MemberSimple', description: 'Membre avec accès de base', permissions: {} },
      { id: 2, typeName: 'MemberPrivilégié', description: 'Membre avec accès privilégié', permissions: {} },
      { id: 3, typeName: 'UtilisateurExterne', description: 'Utilisateur externe avec accès limité', permissions: {} },
      { id: 4, typeName: 'Admin', description: 'Administrateur avec tous les droits', permissions: {} },
      { id: 5, typeName: 'Invité', description: 'Accès invité temporaire', permissions: {} },
    ];
  }

  /**
   * Met à jour le type d'utilisateur
   */
  async updateUserType(walletAddress: string, userTypeId: number): Promise<boolean> {
    const service = await this.getActiveService();
    if (service === SupabaseAuthService) {
      return service.updateUserType(walletAddress, userTypeId);
    }
    return true; // Pas d'implémentation locale pour l'instant
  }

  /**
   * Récupère tous les utilisateurs autorisés
   */
  async getAllUsers() {
    const service = await this.getActiveService();
    return service.getAllUsers();
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(walletAddress: string, status: 'Active' | 'Suspended' | 'Inactive'): Promise<boolean> {
    const service = await this.getActiveService();
    return service.updateUserStatus(walletAddress, status);
  }

  /**
   * Test de connectivité
   */
  async testConnection(): Promise<boolean> {
    const service = await this.getActiveService();
    return service.testConnection();
  }

  /**
   * Obtient le mode actuel
   */
  getCurrentMode(): AuthMode {
    return this.mode;
  }

  /**
   * Synchronise les données du local vers Supabase
   */
  async syncLocalToSupabase(): Promise<boolean> {
    try {
      if (!SupabaseAuthService.isConfigured()) {
        console.error('❌ Supabase non configuré');
        return false;
      }

      const localUsers = await LocalAuthService.getAllUsers();
      console.log(`🔄 Synchronisation de ${localUsers.length} utilisateurs vers Supabase...`);

      for (const user of localUsers) {
        try {
          await SupabaseAuthService.addAuthorizedUser(
            user.walletAddress,
            user.firstName,
            user.lastName
          );
          console.log(`✅ Synchronisé: ${user.walletAddress}`);
        } catch (error) {
          console.warn(`⚠️ Impossible de synchroniser: ${user.walletAddress}`, error);
        }
      }

      console.log('✅ Synchronisation terminée');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      return false;
    }
  }
}

// Export d'une instance singleton
export default new HybridAuthService();