// src/services/FidelityService.ts
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (utilisez vos vraies credentials)
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
        .select('wallet_address, first_name, last_name, fidelity_status, fidelity_nft_claimed, status')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('status', 'Active')
        .single();

      if (error || !data) {
        return {
          isFidel: false,
          hasClaimedNFT: false,
          userInfo: null
        };
      }

      return {
        isFidel: data.fidelity_status === 'OUI',
        hasClaimedNFT: data.fidelity_nft_claimed || false,
        userInfo: {
          firstName: data.first_name,
          lastName: data.last_name,
          status: data.status
        }
      };

    } catch (error) {
      console.error('Erreur vérification fidélité:', error);
      return {
        isFidel: false,
        hasClaimedNFT: false,
        userInfo: null
      };
    }
  }

  static async claimFidelityNFT(walletAddress: string): Promise<boolean> {
    try {
      // 1. Vérifier l'éligibilité une dernière fois
      const fidelityStatus = await this.checkFidelityStatus(walletAddress);
      
      if (!fidelityStatus.isFidel) {
        throw new Error('Utilisateur non éligible pour la fidélité');
      }

      if (fidelityStatus.hasClaimedNFT) {
        throw new Error('NFT de fidélité déjà réclamé');
      }

      // 2. Marquer comme réclamé en base
      const { error } = await supabase
        .from('users_authorized')
        .update({ 
          fidelity_nft_claimed: true,
          fidelity_nft_claimed_date: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress.toLowerCase());

      if (error) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      return true;

    } catch (error) {
      console.error('Erreur réclamation NFT fidélité:', error);
      throw error;
    }
  }
}

// Debug temporaire
console.log('🔍 Supabase Config:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10) + '...'
});

export default FidelityService;