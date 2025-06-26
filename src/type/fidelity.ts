// src/types/fidelity.ts

export interface FidelityUser {
  id: number;
  wallet_address: string;
  first_name: string;
  last_name: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  fidelity_status: 'OUI' | 'NON';
  fidelity_nft_claimed: boolean;
  fidelity_nft_claimed_date?: string;
  fidelity_nft_tx_hash?: string;
  registration_date: string;
  created_at: string;
  user_type_id: number;
  
  // Propriétés ajoutées dynamiquement pour la blockchain
  blockchain_eligible?: boolean;
  blockchain_claimed?: boolean;
}

export interface FidelityStats {
  totalUsers: number;
  dbFidelityUsers: number;
  totalEligible: number;
  totalClaimed: number;
  remaining: number;
  claimRate: number;
  syncedWithBlockchain: number;
}

export interface FidelityEligibility {
  eligible: boolean;
  alreadyClaimed: boolean;
}

export interface FidelityAuditLog {
  id: number;
  action: 'nft_eligible_added' | 'nft_eligible_removed' | 'nft_claimed' | 'sync_blockchain';
  wallet_address: string;
  tx_hash?: string;
  details?: string; // JSON stringifié
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export type FidelityFilterStatus = 'all' | 'eligible' | 'claimed' | 'pending' | 'db_fidelity';

export interface FidelityManagerProps {
  // Props optionnelles si le composant devient réutilisable
  maxSupply?: number;
  contractAddress?: string;
  autoSync?: boolean;
}

// Interfaces pour les hooks
export interface UseFidelityReturn {
  users: FidelityUser[];
  stats: FidelityStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadData: () => Promise<void>;
  addEligible: (address: string) => Promise<string>;
  removeEligible: (address: string) => Promise<string>;
  bulkAddEligible: (addresses: string[]) => Promise<string>;
  syncFidelityUsers: () => Promise<string>;
  markAsClaimed: (user: FidelityUser, txHash: string) => Promise<void>;
  updateFidelityStatus: (address: string, status: 'OUI' | 'NON') => Promise<void>;
}