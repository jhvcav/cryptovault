// src/services/AirtableAuthService.ts
export interface AuthResult {
  isAuthorized: boolean;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  walletAddress?: string;
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

export interface UserData {
  walletAddress: string;
  firstName: string;
  lastName: string;
  registrationDate: string;
  status: 'Active' | 'Suspended' | 'Inactive';
}

class AirtableAuthService {
  private readonly baseUrl = 'https://api.airtable.com/v0';
  private readonly baseId: string;
  private readonly apiKey: string;

  constructor() {
    // Debug complet pour GitHub Pages
    console.log('🔍 MODE:', import.meta.env.MODE);
    console.log('🔍 PROD:', import.meta.env.PROD);
    console.log('🔍 Toutes les variables:', Object.keys(import.meta.env));
    console.log('🔍 BASE_ID raw:', import.meta.env.VITE_AIRTABLE_BASE_ID);
    console.log('🔍 API_KEY présente:', !!import.meta.env.VITE_AIRTABLE_API_KEY);
    
    // Fallback temporaire pour GitHub Pages
    this.baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    this.apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
    
    console.log('🔍 this.baseId final:', this.baseId);
    console.log('🔍 this.apiKey final:', this.apiKey ? 'PRESENT' : 'MISSING');
    
    if (this.apiKey === 'REMPLACEZ_PAR_VOTRE_TOKEN_COMPLET') {
      console.error('❌ ATTENTION: Token API hardcodé temporaire utilisé !');
    }
    
    if (!this.baseId || !this.apiKey) {
      console.error('❌ Variables d\'environnement manquantes !');
    } else {
      console.log('✅ Configuration Airtable chargée');
    }
  }

  /**
   * Méthode générique pour les requêtes Airtable
   */
  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}/${this.baseId}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur requête Airtable:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une adresse wallet est autorisée à accéder à la plateforme
   */
  async checkWalletAccess(walletAddress: string): Promise<AuthResult> {
    try {
      // Validation de l'adresse
      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
        return { isAuthorized: false };
      }

      // Normaliser l'adresse en minuscules pour la comparaison
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('🔍 Adresse normalisée pour recherche:', normalizedAddress);

      // Utiliser LOWER() dans la formule Airtable pour comparaison insensible à la casse
      const endpoint = `Users_Authorized?filterByFormula=LOWER({wallet_address})='${normalizedAddress}'`;
      console.log('🔍 URL complète:', `${this.baseUrl}/${this.baseId}/${endpoint}`);
      
      const data = await this.makeRequest(endpoint);

      if (data.records && data.records.length > 0) {
        const record = data.records[0];
        const fields = record.fields;

        console.log('✅ Utilisateur trouvé:', {
          firstName: fields.first_name,
          lastName: fields.last_name,
          status: fields.status,
          originalAddress: fields.wallet_address
        });

        return {
          isAuthorized: true,
          firstName: fields.first_name || '',
          lastName: fields.last_name || '',
          isActive: fields.status === 'Active',
          walletAddress: fields.wallet_address || normalizedAddress,
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
   * Ajoute un nouvel utilisateur autorisé (fonction admin)
   */
  async addAuthorizedUser(walletAddress: string, firstName: string, lastName: string): Promise<boolean> {
    try {
      // Validation des données
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Format d\'adresse wallet invalide');
      }

      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Prénom et nom requis');
      }

      const body = {
        fields: {
          wallet_address: walletAddress.toLowerCase(), // Normaliser en minuscules
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Active'
        }
      };

      await this.makeRequest('Users_Authorized', 'POST', body);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout utilisateur:', error);
      return false;
    }
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  async updateUserStatus(walletAddress: string, status: 'Active' | 'Suspended' | 'Inactive'): Promise<boolean> {
    try {
      // D'abord, trouver l'enregistrement
      const endpoint = `Users_Authorized?filterByFormula={wallet_address}='${walletAddress}'`;
      const data = await this.makeRequest(endpoint);

      if (!data.records || data.records.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const recordId = data.records[0].id;
      const updateEndpoint = `Users_Authorized/${recordId}`;
      
      const body = {
        fields: {
          status: status
        }
      };

      await this.makeRequest(updateEndpoint, 'PATCH', body);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
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

      const body = {
        fields: {
          wallet_address: [walletAddress], // Lien vers la table Users_Authorized
          investment_type: investmentType,
          apr_rate: aprRate,
          amount_invested: amountInvested,
          start_date: startDate,
          end_date: endDate || '',
        }
      };

      await this.makeRequest('Investments', 'POST', body);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement investissement:', error);
      return false;
    }
  }

  /**
   * Récupère tous les investissements d'un utilisateur
   */
  async getUserInvestments(walletAddress: string): Promise<Investment[]> {
    try {
      const endpoint = `Investments?filterByFormula={wallet_address}='${walletAddress}'&sort[0][field]=start_date&sort[0][direction]=desc`;
      const data = await this.makeRequest(endpoint);

      if (!data.records) {
        return [];
      }

      return data.records.map((record: any) => ({
        id: record.id,
        investmentType: record.fields.investment_type || '',
        aprRate: record.fields.apr_rate || 0,
        amountInvested: record.fields.amount_invested || 0,
        startDate: record.fields.start_date || '',
        endDate: record.fields.end_date || '',
        dailyReturn: record.fields.daily_return || 0,
        weeklyReturn: record.fields.weekly_return || 0,
        monthlyReturn: record.fields.monthly_return || 0,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des investissements:', error);
      return [];
    }
  }

  /**
   * Récupère tous les utilisateurs autorisés (fonction admin)
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      const endpoint = 'Users_Authorized?sort[0][field]=registration_date&sort[0][direction]=desc';
      const data = await this.makeRequest(endpoint);

      if (!data.records) {
        return [];
      }

      return data.records.map((record: any) => ({
        walletAddress: record.fields.wallet_address || '',
        firstName: record.fields.first_name || '',
        lastName: record.fields.last_name || '',
        registrationDate: record.fields.registration_date || '',
        status: record.fields.status || 'Inactive',
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  /**
   * Supprime un investissement
   */
  async deleteInvestment(investmentId: string): Promise<boolean> {
    try {
      const endpoint = `Investments/${investmentId}`;
      await this.makeRequest(endpoint, 'DELETE');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'investissement:', error);
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
      const body = {
        fields: {
          ...(updates.investmentType && { investment_type: updates.investmentType }),
          ...(updates.aprRate !== undefined && { apr_rate: updates.aprRate }),
          ...(updates.amountInvested !== undefined && { amount_invested: updates.amountInvested }),
          ...(updates.endDate && { end_date: updates.endDate }),
        }
      };

      const endpoint = `Investments/${investmentId}`;
      await this.makeRequest(endpoint, 'PATCH', body);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'investissement:', error);
      return false;
    }
  }

  /**
   * Vérifie la connectivité à Airtable
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test avec différents noms de table possibles
      const possibleTableNames = ['Users_Authorized', 'Users', 'Authorized_Users'];
      
      for (const tableName of possibleTableNames) {
        try {
          console.log(`🔍 Test de connexion avec la table: ${tableName}`);
          await this.makeRequest(`${tableName}?maxRecords=1`);
          console.log(`✅ Table trouvée: ${tableName}`);
          return true;
        } catch (error) {
          console.log(`❌ Table non trouvée: ${tableName}`);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur de connexion Airtable:', error);
      return false;
    }
  }
}

// Export d'une instance singleton
export default new AirtableAuthService();