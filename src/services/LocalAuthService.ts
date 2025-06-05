// src/services/LocalAuthService.ts
import { authorizedWallets, AuthorizedWallet } from '../config/authorizedWallets';

export interface AuthResult {
  isAuthorized: boolean;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  walletAddress?: string;
}

class LocalAuthService {
  
  /**
   * Vérifie si une adresse wallet est autorisée
   */
  async checkWalletAccess(walletAddress: string): Promise<AuthResult> {
    try {
      // Validation de l'adresse
      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
        return { isAuthorized: false };
      }

      // Normaliser l'adresse en minuscules pour la comparaison
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔍 Recherche de l\'adresse:', normalizedAddress);

      // Chercher dans la liste locale
      const wallet = authorizedWallets.find(w => 
        w.address.toLowerCase() === normalizedAddress
      );

      if (wallet) {
        console.log('✅ Utilisateur trouvé:', wallet.firstName, wallet.lastName);
        
        return {
          isAuthorized: true,
          firstName: wallet.firstName,
          lastName: wallet.lastName,
          isActive: wallet.status === 'Active',
          walletAddress: wallet.address,
        };
      }

      console.log('❌ Aucun utilisateur trouvé pour l\'adresse:', normalizedAddress);
      return { isAuthorized: false };
    } catch (error) {
      console.error('Erreur lors de la vérification wallet:', error);
      return { isAuthorized: false };
    }
  }

  /**
   * Ajoute un nouvel utilisateur autorisé (pour les admins)
   */
  async addAuthorizedUser(walletAddress: string, firstName: string, lastName: string): Promise<boolean> {
    try {
      // Validation
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
        throw new Error('Format d\'adresse wallet invalide');
      }

      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Prénom et nom requis');
      }

      // Vérifier si l'adresse existe déjà
      const exists = authorizedWallets.some(w => 
        w.address.toLowerCase() === walletAddress.toLowerCase()
      );

      if (exists) {
        console.warn('Adresse déjà autorisée:', walletAddress);
        return false;
      }

      // Ajouter le nouvel utilisateur
      const newWallet: AuthorizedWallet = {
        address: walletAddress.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0]
      };

      authorizedWallets.push(newWallet);
      console.log('✅ Nouvel utilisateur ajouté:', newWallet);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout utilisateur:', error);
      return false;
    }
  }

  /**
   * Récupère tous les utilisateurs autorisés
   */
  async getAllUsers(): Promise<AuthorizedWallet[]> {
    return [...authorizedWallets];
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(walletAddress: string, status: 'Active' | 'Suspended' | 'Inactive'): Promise<boolean> {
    try {
      const wallet = authorizedWallets.find(w => 
        w.address.toLowerCase() === walletAddress.toLowerCase()
      );

      if (wallet) {
        wallet.status = status;
        console.log('✅ Statut mis à jour:', walletAddress, '→', status);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }
  }

  /**
   * Test de connectivité (toujours OK pour le service local)
   */
  async testConnection(): Promise<boolean> {
    console.log('✅ Service local : Connexion OK');
    console.log('📋 Wallets autorisés:', authorizedWallets.length);
    return true;
  }
}

// Export d'une instance singleton
export default new LocalAuthService();