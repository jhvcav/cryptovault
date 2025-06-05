  /**
   * Vérifie si Supabase est configuré
   */// src/services/SupabaseAuthService.ts
export interface AuthResult {
  isAuthorized: boolean;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  walletAddress?: string;
}

export interface UserData {
  walletAddress: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  userType: string;
  userTypeId: number;
}

export interface UserType {
  id: number;
  typeName: string;
  description: string;
  permissions: Record<string, boolean>;
}

class SupabaseAuthService {
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor() {
    // Variables d'environnement Supabase
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ Variables d\'environnement Supabase manquantes');
    } else {
      console.log('✅ Supabase configuré:', this.supabaseUrl ? 'URL OK' : 'URL manquante');
    }
  }

  /**
   * Méthode générique pour les requêtes Supabase
   */
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': method === 'POST' ? 'return=representation' : ''
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur requête Supabase:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une adresse wallet est autorisée
   */
  async checkWalletAccess(walletAddress: string): Promise<AuthResult> {
    try {
      // Validation de l'adresse
      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
        return { isAuthorized: false };
      }

      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔍 Supabase - Recherche de l\'adresse:', normalizedAddress);

      // Requête avec JOIN pour récupérer le type d'utilisateur
      const endpoint = `users_authorized?select=*,user_types(type_name,permissions)&wallet_address=ilike.${normalizedAddress}&limit=1`;
      const data = await this.makeRequest(endpoint);

      if (data && data.length > 0) {
        const user = data[0];
        console.log('✅ Supabase - Utilisateur trouvé:', user.first_name, user.last_name, 'Type:', user.user_types?.type_name);

        return {
          isAuthorized: true,
          firstName: user.first_name,
          lastName: user.last_name,
          isActive: user.status === 'Active',
          walletAddress: user.wallet_address,
        };
      }

      console.log('❌ Supabase - Aucun utilisateur trouvé pour l\'adresse:', normalizedAddress);
      return { isAuthorized: false };
    } catch (error) {
      console.error('Erreur Supabase lors de la vérification wallet:', error);
      return { isAuthorized: false };
    }
  }

  /**
   * Ajoute un nouvel utilisateur autorisé
   */
  async addAuthorizedUser(walletAddress: string, firstName: string, lastName: string, userTypeId: number = 1): Promise<boolean> {
    try {
      // Validation
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
        throw new Error('Format d\'adresse wallet invalide');
      }

      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Prénom et nom requis');
      }

      const body = {
        wallet_address: walletAddress.toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        status: 'Active',
        user_type_id: userTypeId
      };

      await this.makeRequest('users_authorized', 'POST', body);
      console.log('✅ Supabase - Utilisateur ajouté:', walletAddress);
      return true;
    } catch (error) {
      console.error('Erreur Supabase lors de l\'ajout utilisateur:', error);
      return false;
    }
  }

  /**
   * Récupère tous les utilisateurs autorisés
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      // Requête avec JOIN pour récupérer les types d'utilisateurs
      const data = await this.makeRequest('users_authorized?select=*,user_types(type_name)&order=created_at.desc');

      return data.map((user: any) => ({
        walletAddress: user.wallet_address,
        firstName: user.first_name,
        lastName: user.last_name,
        registrationDate: user.registration_date,
        status: user.status,
        userType: user.user_types?.type_name || 'MemberSimple',
        userTypeId: user.user_type_id,
      }));
    } catch (error) {
      console.error('Erreur Supabase lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(walletAddress: string, status: 'Active' | 'Suspended' | 'Inactive'): Promise<boolean> {
    try {
      const endpoint = `users_authorized?wallet_address=eq.${walletAddress.toLowerCase()}`;
      await this.makeRequest(endpoint, 'PATCH', { status });
      console.log('✅ Supabase - Statut mis à jour:', walletAddress, '→', status);
      return true;
    } catch (error) {
      console.error('Erreur Supabase lors de la mise à jour du statut:', error);
      return false;
    }
  }

  /**
   * Test de connectivité Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('users_authorized?limit=1');
      console.log('✅ Supabase - Connexion OK');
      return true;
    } catch (error) {
      console.error('❌ Supabase - Erreur de connexion:', error);
      return false;
    }
  }

  /**
   * Récupère tous les types d'utilisateurs
   */
  async getUserTypes(): Promise<UserType[]> {
    try {
      const data = await this.makeRequest('user_types?order=id.asc');

      return data.map((type: any) => ({
        id: type.id,
        typeName: type.type_name,
        description: type.description,
        permissions: type.permissions || {},
      }));
    } catch (error) {
      console.error('Erreur Supabase lors de la récupération des types:', error);
      return [];
    }
  }

  /**
   * Met à jour le type d'utilisateur
   */
  async updateUserType(walletAddress: string, userTypeId: number): Promise<boolean> {
    try {
      const endpoint = `users_authorized?wallet_address=eq.${walletAddress.toLowerCase()}`;
      await this.makeRequest(endpoint, 'PATCH', { user_type_id: userTypeId });
      console.log('✅ Supabase - Type utilisateur mis à jour:', walletAddress, '→', userTypeId);
      return true;
    } catch (error) {
      console.error('Erreur Supabase lors de la mise à jour du type:', error);
      return false;
    }
  }
  isConfigured(): boolean {
    return !!(this.supabaseUrl && this.supabaseKey);
  }
}

// Export d'une instance singleton
export default new SupabaseAuthService();