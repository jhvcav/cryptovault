// src/services/FidelityService.ts - Version mise à jour avec smart contract
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface FidelityResult {
  isFidel: boolean;
  hasClaimedNFT: boolean;
  userInfo: {
    firstName: string;
    lastName: string;
    status: string;
  } | null;
}

class FidelityService {
  static async checkFidelityStatus(walletAddress: string): Promise<FidelityResult> {
    try {
      const { data, error } = await supabase
        .from('users_authorized')
        .select(`
          id,
          wallet_address, 
          first_name, 
          last_name, 
          fidelity_status, 
          fidelity_nft_claimed, 
          fidelity_nft_claimed_date,
          fidelity_nft_tx_hash,
          status,
          user_type_id
        `)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('status', 'Active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucun utilisateur trouvé
          console.log(`ℹ️ Utilisateur ${walletAddress} non trouvé dans users_authorized`);
          return {
            isFidel: false,
            hasClaimedNFT: false,
            userInfo: null
          };
        }
        throw error;
      }

      if (!data) {
        return {
          isFidel: false,
          hasClaimedNFT: false,
          userInfo: null
        };
      }

      const isFidel = data.fidelity_status === 'OUI';
      const hasClaimedNFT = data.fidelity_nft_claimed === 'true' || data.fidelity_nft_claimed === true;

      console.log(`📊 Statut fidélité pour ${data.first_name} ${data.last_name}:`, {
        wallet: walletAddress,
        isFidel,
        hasClaimedNFT,
        claimedDate: data.fidelity_nft_claimed_date,
        txHash: data.fidelity_nft_tx_hash
      });

      return {
        isFidel,
        hasClaimedNFT,
        userInfo: {
          firstName: data.first_name,
          lastName: data.last_name,
          status: data.status
        }
      };

    } catch (error) {
      console.error('❌ Erreur vérification fidélité:', error);
      return {
        isFidel: false,
        hasClaimedNFT: false,
        userInfo: null
      };
    }
  }

  // ✅ MISE À JOUR: Cette fonction maintenant ne fait que la mise à jour en base
  // La transaction blockchain est gérée par le NFTService
  static async markFidelityNFTAsClaimed(walletAddress: string, txHash?: string): Promise<boolean> {
    try {
      // 1. Vérifier l'éligibilité une dernière fois
      const fidelityStatus = await this.checkFidelityStatus(walletAddress);
      
      if (!fidelityStatus.isFidel) {
        throw new Error('Utilisateur non éligible pour la fidélité');
      }

      if (fidelityStatus.hasClaimedNFT) {
        console.log('NFT de fidélité déjà marqué comme réclamé en base');
        return true; // Pas d'erreur si déjà réclamé
      }

      // 2. Marquer comme réclamé en base avec la transaction hash
      const updateData: any = {
        fidelity_nft_claimed: 'true',
        fidelity_nft_claimed_date: new Date().toISOString()
      };

      if (txHash) {
        updateData.fidelity_nft_tx_hash = txHash;
      }

      const { error } = await supabase
        .from('users_authorized')
        .update(updateData)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('fidelity_status', 'OUI')
        .eq('status', 'Active');

      if (error) {
        throw new Error('Erreur lors de la mise à jour du statut: ' + error.message);
      }

      console.log('✅ Statut NFT fidélité mis à jour en base de données');
      return true;

    } catch (error) {
      console.error('Erreur mise à jour statut NFT fidélité:', error);
      throw error;
    }
  }

  // ✅ NOUVELLE FONCTION: Réclamation complète avec smart contract + base de données
  static async claimMyFidelityNFTComplete(walletAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
  }> {
    try {
      console.log('🎁 Début réclamation complète NFT fidélité pour:', walletAddress);

      // 1. Vérifier l'éligibilité
      const fidelityStatus = await this.checkFidelityStatus(walletAddress);
      
      if (!fidelityStatus.isFidel) {
        return {
          success: false,
          error: 'Utilisateur non éligible pour la fidélité'
        };
      }

      if (fidelityStatus.hasClaimedNFT) {
        return {
          success: false,
          error: 'NFT de fidélité déjà réclamé'
        };
      }

      // 2. Importer et utiliser votre NFTService pour la transaction blockchain
      const extensibleNFTService = (await import('./NFTService')).default;
      
      // 3. Exécuter la transaction sur le smart contract
      const blockchainResult = await extensibleNFTService.claimMyFidelityNFT(walletAddress);
      
      if (!blockchainResult.success) {
        return {
          success: false,
          error: blockchainResult.error || 'Erreur transaction blockchain'
        };
      }

      console.log('✅ Transaction blockchain réussie:', blockchainResult);

      // 4. Mettre à jour la base de données
      try {
        await this.markFidelityNFTAsClaimed(walletAddress, blockchainResult.txHash);
      } catch (dbError) {
        console.warn('⚠️ Transaction blockchain réussie mais erreur mise à jour BDD:', dbError);
        // On retourne quand même succès car le NFT a été mint
      }

      return {
        success: true,
        txHash: blockchainResult.txHash,
        tokenId: blockchainResult.tokenId
      };

    } catch (error: any) {
      console.error('❌ Erreur réclamation complète NFT fidélité:', error);
      return {
        success: false,
        error: error.message || 'Erreur inattendue lors de la réclamation'
      };
    }
  }

  // ✅ NOUVELLE FONCTION: Vérifier la cohérence entre blockchain et base de données
  static async checkConsistency(walletAddress: string): Promise<{
    consistent: boolean;
    databaseClaimed: boolean;
    blockchainOwned: boolean;
    recommendation: string;
  }> {
    try {
      // Vérifier la base de données
      const dbStatus = await this.checkFidelityStatus(walletAddress);
      
      // Vérifier la blockchain
      const extensibleNFTService = (await import('./NFTService')).default;
      const blockchainOwned = await extensibleNFTService.userHasFidelityNFT(walletAddress);
      
      const consistent = dbStatus.hasClaimedNFT === blockchainOwned;
      
      let recommendation = '';
      if (!consistent) {
        if (dbStatus.hasClaimedNFT && !blockchainOwned) {
          recommendation = 'Base de données indique réclamé mais NFT absent sur blockchain - synchronisation requise';
        } else if (!dbStatus.hasClaimedNFT && blockchainOwned) {
          recommendation = 'NFT présent sur blockchain mais pas marqué en base - mise à jour BDD requise';
        }
      } else {
        recommendation = 'Données cohérentes entre blockchain et base de données';
      }
      
      return {
        consistent,
        databaseClaimed: dbStatus.hasClaimedNFT,
        blockchainOwned,
        recommendation
      };
      
    } catch (error) {
      console.error('Erreur vérification cohérence:', error);
      return {
        consistent: false,
        databaseClaimed: false,
        blockchainOwned: false,
        recommendation: 'Erreur lors de la vérification - réessayer plus tard'
      };
    }
  }

  // ✅ FONCTION DE SYNCHRONISATION
  static async syncFidelityStatus(walletAddress: string): Promise<{
    success: boolean;
    action: string;
    message: string;
  }> {
    try {
      const consistency = await this.checkConsistency(walletAddress);
      
      if (consistency.consistent) {
        return {
          success: true,
          action: 'none',
          message: 'Aucune synchronisation nécessaire - données cohérentes'
        };
      }
      
      // Si NFT présent sur blockchain mais pas en base, mettre à jour la base
      if (!consistency.databaseClaimed && consistency.blockchainOwned) {
        await this.markFidelityNFTAsClaimed(walletAddress);
        return {
          success: true,
          action: 'database_updated',
          message: 'Base de données mise à jour selon l\'état blockchain'
        };
      }
      
      // Si NFT marqué en base mais absent sur blockchain
      if (consistency.databaseClaimed && !consistency.blockchainOwned) {
        return {
          success: false,
          action: 'manual_intervention',
          message: 'Incohérence détectée - intervention manuelle requise'
        };
      }
      
      return {
        success: false,
        action: 'unknown',
        message: 'État incohérent non géré'
      };
      
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      return {
        success: false,
        action: 'error',
        message: 'Erreur lors de la synchronisation'
      };
    }
  }

  // Fonction legacy - maintenant utilise la nouvelle fonction complète
  static async claimMyFidelityNFT(walletAddress: string): Promise<boolean> {
    const result = await this.claimMyFidelityNFTComplete(walletAddress);
    return result.success;
  }
}

// Debug temporaire
console.log('🔍 Supabase Config:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + '...'
});

export default FidelityService;