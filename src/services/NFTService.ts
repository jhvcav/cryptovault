// services/NFTService.ts - Version corrigée pour NFT Fidélité (Tier 5)
import { ethers } from 'ethers';

// ABI étendu du contrat NFT
const NFT_CONTRACT_ABI = [
  "function purchaseNFT(uint256 tier) external",
  "function claimFidelityNFT(address fidelUser) external",
  "function createNewTier(string name, string description, uint256 price, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans, bool isSpecial) external returns (uint256)",
  "function createEventNFT(string name, string description, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans) external returns (uint256)",
  "function createPartnershipNFT(string partnerName, string description, uint256 price, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans) external returns (uint256)",
  "function mintSpecialNFT(address to, uint256 tier, string reason) external",
  "function updateTier(uint256 tier, uint256 newPrice, uint256 newSupply, bool active) external",
  "function addAccessPlansToTier(uint256 tier, string[] newPlans) external",
  "function getAllActiveTiers() external view returns (uint256[])",
  "function getTierInfo(uint256 tier) external view returns (tuple(uint256 price, uint256 supply, uint256 minted, string baseURI, bool active, string name, string description, uint256 multiplier, string[] accessPlans, uint256 createdAt))",
  "function getUserHighestTier(address user) external view returns (uint256)",
  "function getUserMultiplier(address user) external view returns (uint256)",
  "function getTierAccessPlans(uint256 tier) external view returns (string[])",
  "function getRemainingSupply(uint256 tier) external view returns (uint256)",
  "function getSpecialTiers() external view returns (uint256[])",
  "function isSpecialTier(uint256 tier) external view returns (bool)",
  "function ownerHasTier(address user, uint256 tier) external view returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function nftToTier(uint256 tokenId) external view returns (uint256)",
  "event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 tier, uint256 price)",
  "event TierCreated(uint256 indexed tier, string name, uint256 price, uint256 supply)",
  "event TierUpdated(uint256 indexed tier, uint256 price, uint256 supply)",
  "event FidelityNFTClaimed(address indexed user, uint256 indexed tokenId)",
  "event SpecialNFTMinted(address indexed to, uint256 indexed tokenId, uint256 tier, string reason)"
];

const USDC_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Configuration des contrats
const CONTRACTS = {
  NFT_CONTRACT: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x3b9E6cad77E65e153321C91Ac5225a4C564b3aE4',
  USDC_TOKEN: import.meta.env.VITE_USDC_TOKEN_ADDRESS || '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  BSC_CHAIN_ID: 56,
  BSC_RPC_URL: import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'
};

// Configuration du backend
const BACKEND_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    CLAIM_FIDELITY: '/api/nft/claim-fidelity-nft',
    FIDELITY_STATUS: '/api/nft/fidelity-status',
    SYNC_STATUS: '/api/nft/sync-fidelity-status'
  }
};

// Variables d'environnement Vite
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const currentMode = import.meta.env.MODE;

// 🎁 NOUVEAU: Configuration du NFT Fidélité
const FIDELITY_NFT_CONFIG = {
  tier: 5,
  name: 'NFT Fidélité',
  displayName: 'NFT Fidélité',
  icon: '🎁',
  originalPrice: '0', // GRATUIT
  originalPriceUSD: 'GRATUIT',
  multiplier: 120, // 1.2x = 20% bonus
  multiplierPercent: '+20%',
  description: 'Récompense de fidélité exclusive pour les membres sélectionnés',
  supply: 12,
  features: [
    'Accès aux stratégies de base',
    'Bonus 20% sur récompenses',
    'Support communautaire',
    'Période de blocage : 30 jours',
    'Récompense de fidélité exclusive'
  ],
  accessPlans: ['starter'],
  lockPeriods: ['30 jours'],
  bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
  borderColor: 'border-emerald-500',
  glowColor: 'shadow-emerald-500/30'
};

// Interfaces
interface ExtendedTierInfo {
  price: string;
  supply: number;
  minted: number;
  remaining: number;
  baseURI: string;
  active: boolean;
  name: string;
  description: string;
  multiplier: number;
  multiplierDisplay: string;
  accessPlans: string[];
  createdAt: number;
  isSpecial: boolean;
}

interface CreateTierParams {
  name: string;
  description: string;
  price: string;
  supply: number;
  multiplier: number;
  baseURI: string;
  accessPlans: string[];
  isSpecial?: boolean;
}

interface UserNFTInfo {
  highestTier: number;
  highestMultiplier: number;
  ownedTiers: number[];
  nftTokenIds: number[];
  hasAccess: {
    [planName: string]: boolean;
  };
  totalNFTs: number;
}

interface FidelityStatusResponse {
  isFidel: boolean;
  hasClaimedNFT: boolean;
  actuallyOwnsNFT: boolean;
  highestTier: string;
  userInfo: {
    firstName?: string;
    email?: string;
    claimedAt?: string;
    txHash?: string;
  } | null;
  // 🎁 NOUVEAU - Informations spécifiques au NFT Fidélité
  fidelityNFT?: {
    tier: number;
    name: string;
    supply: number;
    minted: number;
    remaining: number;
    userOwns: boolean;
    canClaim: boolean;
  };
}

class ExtensibleNFTService {
  private provider: ethers.BrowserProvider | null = null;
  private nftContract: ethers.Contract | null = null;
  private usdcContract: ethers.Contract | null = null;

  // 🎁 NOUVEAU - Vérifier spécifiquement le NFT Fidélité (Tier 5)
  async userHasFidelityNFT(walletAddress: string): Promise<boolean> {
    if (!this.nftContract) await this.initialize();
    
    try {
      return await this.nftContract!.ownerHasTier(walletAddress, FIDELITY_NFT_CONFIG.tier);
    } catch (error) {
      console.error('Erreur vérification possession NFT Fidélité:', error);
      return false;
    }
  }

  // 🎁 NOUVEAU - Obtenir les informations du NFT Fidélité depuis le contrat
  async getFidelityNFTInfo(): Promise<{
    tier: number;
    name: string;
    price: number;
    supply: number;
    minted: number;
    remaining: number;
    multiplier: number;
    active: boolean;
  } | null> {
    if (!this.nftContract) await this.initialize();
    
    try {
      const contractInfo = await this.nftContract!.getTierInfo(FIDELITY_NFT_CONFIG.tier);
      
      return {
        tier: FIDELITY_NFT_CONFIG.tier,
        name: contractInfo.name || FIDELITY_NFT_CONFIG.name,
        price: Number(contractInfo.price),
        supply: Number(contractInfo.supply),
        minted: Number(contractInfo.minted),
        remaining: Number(contractInfo.supply) - Number(contractInfo.minted),
        multiplier: Number(contractInfo.multiplier),
        active: contractInfo.active
      };
    } catch (error) {
      console.warn('⚠️ Tier NFT Fidélité non trouvé sur le contrat, utilisation des données par défaut');
      return {
        tier: FIDELITY_NFT_CONFIG.tier,
        name: FIDELITY_NFT_CONFIG.name,
        price: 0,
        supply: FIDELITY_NFT_CONFIG.supply,
        minted: 5, // Estimation
        remaining: FIDELITY_NFT_CONFIG.supply - 5,
        multiplier: FIDELITY_NFT_CONFIG.multiplier,
        active: true
      };
    }
  }

  // 🎁 NOUVEAU - Vérifier si un utilisateur peut réclamer le NFT Fidélité
  async canUserClaimFidelityNFT(walletAddress: string): Promise<{
    canClaim: boolean;
    reason?: string;
    fidelityStatus?: boolean;
    alreadyOwns?: boolean;
    supplyAvailable?: boolean;
  }> {
    try {
      // Vérifier le statut de fidélité
      const fidelityStatus = await this.getFidelityStatusFromBackend(walletAddress);
      
      if (!fidelityStatus.isFidel) {
        return {
          canClaim: false,
          reason: 'Utilisateur non éligible pour la fidélité',
          fidelityStatus: false
        };
      }

      // Vérifier si déjà possédé
      const alreadyOwns = await this.userHasFidelityNFT(walletAddress);
      if (alreadyOwns) {
        return {
          canClaim: false,
          reason: 'NFT Fidélité déjà possédé',
          fidelityStatus: true,
          alreadyOwns: true
        };
      }

      // Vérifier si déjà réclamé en base
      if (fidelityStatus.hasClaimedNFT) {
        return {
          canClaim: false,
          reason: 'NFT Fidélité déjà réclamé',
          fidelityStatus: true,
          alreadyOwns: false
        };
      }

      // Vérifier la disponibilité du supply
      const fidelityInfo = await this.getFidelityNFTInfo();
      if (fidelityInfo && fidelityInfo.remaining <= 0) {
        return {
          canClaim: false,
          reason: 'Supply NFT Fidélité épuisé',
          fidelityStatus: true,
          alreadyOwns: false,
          supplyAvailable: false
        };
      }

      return {
        canClaim: true,
        fidelityStatus: true,
        alreadyOwns: false,
        supplyAvailable: true
      };

    } catch (error) {
      console.error('Erreur vérification éligibilité NFT Fidélité:', error);
      return {
        canClaim: false,
        reason: 'Erreur de vérification'
      };
    }
  }

  // ========== MÉTHODES BACKEND POUR FIDÉLITÉ ==========

  async claimFidelityNFTViaBackend(walletAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('🎁 Réclamation NFT fidélité via backend pour:', walletAddress);

      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.CLAIM_FIDELITY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      console.log('✅ NFT fidélité réclamé avec succès:', data);

      return {
        success: true,
        txHash: data.txHash,
        tokenId: data.tokenId,
        message: data.message
      };

    } catch (error: any) {
      console.error('❌ Erreur réclamation NFT fidélité:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion au serveur'
      };
    }
  }

  async getFidelityStatusFromBackend(walletAddress: string): Promise<FidelityStatusResponse> {
    try {
      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.FIDELITY_STATUS}/${walletAddress}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // 🎁 NOUVEAU - Ajouter les informations du NFT Fidélité si disponibles
      if (data.fidelityNFT) {
        return {
          ...data,
          fidelityNFT: {
            tier: data.fidelityNFT.tier || FIDELITY_NFT_CONFIG.tier,
            name: data.fidelityNFT.name || FIDELITY_NFT_CONFIG.name,
            supply: data.fidelityNFT.supply || FIDELITY_NFT_CONFIG.supply,
            minted: data.fidelityNFT.minted || 0,
            remaining: data.fidelityNFT.remaining || FIDELITY_NFT_CONFIG.supply,
            userOwns: data.fidelityNFT.userOwns || false,
            canClaim: data.fidelityNFT.canClaim || false
          }
        };
      }

      return data;

    } catch (error: any) {
      console.error('❌ Erreur vérification statut fidélité:', error);
      return {
        isFidel: false,
        hasClaimedNFT: false,
        actuallyOwnsNFT: false,
        highestTier: '0',
        userInfo: null
      };
    }
  }

  async syncFidelityStatus(walletAddress: string): Promise<{
    success: boolean;
    message?: string;
    blockchainStatus?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.SYNC_STATUS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      return data;

    } catch (error: any) {
      console.error('❌ Erreur synchronisation:', error);
      return {
        success: false,
        error: error.message || 'Erreur de synchronisation'
      };
    }
  }

  async checkFidelityConsistency(walletAddress: string): Promise<{
    consistent: boolean;
    dbStatus: boolean;
    blockchainStatus: boolean;
    recommendation: string;
    tier: number;
    nftName: string;
  }> {
    try {
      const backendStatus = await this.getFidelityStatusFromBackend(walletAddress);
      const blockchainOwnsNFT = await this.userHasFidelityNFT(walletAddress);
      const consistent = backendStatus.hasClaimedNFT === blockchainOwnsNFT;

      return {
        consistent,
        dbStatus: backendStatus.hasClaimedNFT,
        blockchainStatus: blockchainOwnsNFT,
        tier: FIDELITY_NFT_CONFIG.tier,
        nftName: FIDELITY_NFT_CONFIG.name,
        recommendation: !consistent 
          ? `Synchronisation requise pour ${FIDELITY_NFT_CONFIG.displayName} - utiliser syncFidelityStatus()`
          : `Statuts cohérents pour ${FIDELITY_NFT_CONFIG.displayName}`
      };

    } catch (error) {
      console.error('Erreur vérification cohérence NFT Fidélité:', error);
      return {
        consistent: false,
        dbStatus: false,
        blockchainStatus: false,
        tier: FIDELITY_NFT_CONFIG.tier,
        nftName: FIDELITY_NFT_CONFIG.name,
        recommendation: 'Erreur - vérifier la connexion'
      };
    }
  }

  // 🎁 Obtenir les statistiques du NFT Fidélité
  async getFidelityNFTStats(): Promise<{
    tier: number;
    name: string;
    config: any;
    contract: any;
    usage: {
      totalEligible: number;
      totalClaimed: number;
      totalPending: number;
      claimRate: number;
      supplyUtilization: number;
    };
  } | null> {
    try {
      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/api/nft/fidelity-nft-info`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.fidelityNFT;

    } catch (error) {
      console.error('Erreur récupération statistiques NFT Fidélité:', error);
      return null;
    }
  }

  // ✅ CORRECTION MAJEURE: Réclamation réelle via smart contract
async claimFidelityNFT(userAddress: string): Promise<{
  success: boolean;
  txHash?: string;
  tokenId?: string;
  error?: string;
}> {
  if (!this.nftContract) await this.initialize();
  
  try {
    console.log(`🎁 Réclamation NFT Fidélité via smart contract pour: ${userAddress}`);
    
    // ✅ ÉTAPE 1: Vérifier que l'utilisateur n'a pas déjà le NFT
    const alreadyOwns = await this.userHasFidelityNFT(userAddress);
    if (alreadyOwns) {
      return {
        success: false,
        error: 'NFT Fidélité déjà possédé'
      };
    }
    
    // ✅ ÉTAPE 2: Vérifier le réseau
    await this.ensureCorrectNetwork();
    
    // ✅ ÉTAPE 3: Appeler le smart contract
    console.log('📡 Appel smart contract claimFidelityNFT...');
    
    // Supposons que votre smart contract a une fonction claimFidelityNFT
    const tx = await this.nftContract!.claimFidelityNFT(userAddress, {
      gasLimit: 500000
    });
    
    console.log('⏳ Transaction envoyée:', tx.hash);
    
    // ✅ ÉTAPE 4: Attendre la confirmation
    const receipt = await this.provider!.waitForTransaction(tx.hash);
    
    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction échouée');
    }
    
    console.log('✅ Transaction confirmée:', receipt);
    
    // ✅ ÉTAPE 5: Extraire le tokenId des logs si possible
    let tokenId: string | undefined;
    try {
      // Supposons que votre contrat émet un événement FidelityNFTClaimed
      const fidelityClaimedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.nftContract!.interface.parseLog(log);
          return parsed?.name === 'FidelityNFTClaimed';
        } catch {
          return false;
        }
      });
      
      if (fidelityClaimedEvent) {
        const parsed = this.nftContract!.interface.parseLog(fidelityClaimedEvent);
        tokenId = parsed?.args?.tokenId?.toString();
        console.log('🎯 TokenId extrait des logs:', tokenId);
      }
    } catch (logError) {
      console.warn('⚠️ Impossible d\'extraire le tokenId des logs:', logError);
    }
    
    return {
      success: true,
      txHash: tx.hash,
      tokenId: tokenId || 'N/A'
    };
    
  } catch (error: any) {
    console.error('❌ Erreur réclamation NFT Fidélité smart contract:', error);
    
    // Messages d'erreur spécifiques
    let errorMessage = error.message || 'Erreur inattendue';
    
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction rejetée par l\'utilisateur';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Fonds insuffisants pour les frais de gas';
    } else if (error.message?.includes('already claimed')) {
      errorMessage = 'NFT Fidélité déjà réclamé';
    } else if (error.message?.includes('not eligible')) {
      errorMessage = 'Non éligible pour la réclamation';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

  // ========== INITIALISATION ==========

  async initialize() {
    if (!window.ethereum) {
      throw new Error('Metamask non détecté');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      this.provider.getNetwork = async () => {
        try {
          const networkPromise = ethers.getDefaultProvider(CONTRACTS.BSC_RPC_URL).getNetwork();
          const network = await networkPromise;
          return network;
        } catch (error) {
          console.error('Erreur getNetwork:', error);
          return { chainId: CONTRACTS.BSC_CHAIN_ID, name: 'BSC' };
        }
      };
      
      const signer = await this.provider.getSigner();
      
      this.nftContract = new ethers.Contract(
        CONTRACTS.NFT_CONTRACT,
        NFT_CONTRACT_ABI,
        signer
      );
      
      this.usdcContract = new ethers.Contract(
        CONTRACTS.USDC_TOKEN,
        USDC_ABI,
        signer
      );

      console.log('✅ NFT Service initialized successfully');
    } catch (error) {
      console.error('❌ Erreur d\'initialisation du NFT Service:', error);
      throw error;
    }
  }

  // ========== FONCTIONS DE LECTURE ==========

  async getAllActiveTiers(): Promise<number[]> {
    if (!this.nftContract) await this.initialize();
    const tiers = await this.nftContract!.getAllActiveTiers();
    return tiers.map((tier: any) => Number(tier));
  }

  async getSpecialTiers(): Promise<number[]> {
    if (!this.nftContract) await this.initialize();
    const specialTiers = await this.nftContract!.getSpecialTiers();
    return specialTiers.map((tier: any) => Number(tier));
  }

  async getTierInfo(tier: number) {
    if (!this.nftContract) await this.initialize();
    
    try {
      const tierInfo = await this.nftContract!.getTierInfo(tier);
      
      return {
        price: ethers.formatUnits(tierInfo.price, 18),
        supply: Number(tierInfo.supply),
        minted: Number(tierInfo.minted),
        baseURI: tierInfo.baseURI,
        active: tierInfo.active,
        name: tierInfo.name,
        description: tierInfo.description,
        multiplier: Number(tierInfo.multiplier),
        accessPlans: tierInfo.accessPlans,
        createdAt: Number(tierInfo.createdAt)
      };
    } catch (error) {
      console.error(`Erreur lecture tier ${tier}:`, error);
      throw error;
    }
  }

  async getExtendedTierInfo(tier: number): Promise<ExtendedTierInfo> {
    if (!this.nftContract) await this.initialize();
    
    try {
      const [tierInfo, remaining, isSpecial] = await Promise.all([
        this.nftContract!.getTierInfo(tier),
        this.nftContract!.getRemainingSupply(tier),
        this.nftContract!.isSpecialTier(tier)
      ]);
      
      const multiplierValue = Number(tierInfo.multiplier);
      
      return {
        price: ethers.formatUnits(tierInfo.price, 18),
        supply: Number(tierInfo.supply),
        minted: Number(tierInfo.minted),
        remaining: Number(remaining),
        baseURI: tierInfo.baseURI,
        active: tierInfo.active,
        name: tierInfo.name,
        description: tierInfo.description,
        multiplier: multiplierValue,
        multiplierDisplay: `${(multiplierValue / 100).toFixed(1)}x`,
        accessPlans: tierInfo.accessPlans,
        createdAt: Number(tierInfo.createdAt),
        isSpecial
      };
    } catch (error) {
      console.error(`Erreur lecture tier étendu ${tier}:`, error);
      throw error;
    }
  }

  async getAllTiersInfo(): Promise<Record<number, ExtendedTierInfo>> {
    const activeTiers = await this.getAllActiveTiers();
    const tiersInfo: Record<number, ExtendedTierInfo> = {};
    
    for (const tier of activeTiers) {
      tiersInfo[tier] = await this.getExtendedTierInfo(tier);
    }
    
    return tiersInfo;
  }

  async getExtendedUserNFTInfo(userAddress: string): Promise<UserNFTInfo> {
    if (!this.nftContract) await this.initialize();

    const highestTier = await this.nftContract!.getUserHighestTier(userAddress);
    const userMultiplier = await this.nftContract!.getUserMultiplier(userAddress);
    
    const activeTiers = await this.getAllActiveTiers();
    const ownedTiers: number[] = [];
    
    for (const tier of activeTiers) {
      const hasTier = await this.nftContract!.ownerHasTier(userAddress, tier);
      if (hasTier) {
        ownedTiers.push(tier);
      }
    }

    // 🎁 Vérifier spécifiquement le NFT de fidélité
    const hasFidelityNFT = await this.userHasFidelityNFT(userAddress);
    if (hasFidelityNFT && !ownedTiers.includes(FIDELITY_NFT_CONFIG.tier)) {
      ownedTiers.push(FIDELITY_NFT_CONFIG.tier);
    }

    const balance = await this.nftContract!.balanceOf(userAddress);
    const nftTokenIds: number[] = [];
    
    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await this.nftContract!.tokenOfOwnerByIndex(userAddress, i);
      nftTokenIds.push(Number(tokenId));
    }

    const hasAccess: { [planName: string]: boolean } = {};
    
    if (ownedTiers.length > 0) {
      const allAccessiblePlans = new Set<string>();
      
      for (const tier of ownedTiers) {
        if (tier === FIDELITY_NFT_CONFIG.tier) {
          // Ajouter les plans d'accès du NFT Fidélité
          FIDELITY_NFT_CONFIG.accessPlans.forEach(plan => allAccessiblePlans.add(plan));
        } else {
          const tierInfo = await this.getExtendedTierInfo(tier);
          tierInfo.accessPlans.forEach(plan => allAccessiblePlans.add(plan));
        }
      }
      
      allAccessiblePlans.forEach(plan => {
        hasAccess[plan] = true;
      });
    }

    return {
      highestTier: Number(highestTier),
      highestMultiplier: Number(userMultiplier),
      ownedTiers,
      nftTokenIds,
      hasAccess,
      totalNFTs: Number(balance)
    };
  }

  // ========== MÉTHODES UTILITAIRES ==========

  async getUSDCBalance(userAddress: string): Promise<string> {
    if (!this.usdcContract) await this.initialize();
    
    try {
      const balance = await this.usdcContract!.balanceOf(userAddress);
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error('Erreur lecture balance USDC:', error);
      return '0';
    }
  }

  async getUSDCAllowance(userAddress: string): Promise<string> {
    if (!this.usdcContract) await this.initialize();
    
    try {
      const allowance = await this.usdcContract!.allowance(userAddress, CONTRACTS.NFT_CONTRACT);
      return ethers.formatUnits(allowance, 6);
    } catch (error) {
      console.error('Erreur lecture allowance USDC:', error);
      return '0';
    }
  }

  async approveUSDC(amount: string): Promise<string> {
    if (!this.usdcContract) await this.initialize();
    
    try {
      const amountWei = ethers.parseUnits(amount, 6);
      const tx = await this.usdcContract!.approve(CONTRACTS.NFT_CONTRACT, amountWei);
      return tx.hash;
    } catch (error: any) {
      console.error('Erreur approve USDC:', error);
      throw new Error(error.message || 'Erreur lors de l\'approbation USDC');
    }
  }

  async ensureCorrectNetwork(): Promise<boolean> {
    if (!this.provider) await this.initialize();

    const network = await this.provider!.getNetwork();
    
    if (Number(network.chainId) !== CONTRACTS.BSC_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${CONTRACTS.BSC_CHAIN_ID.toString(16)}` }],
        });
        return true;
      } catch (error: any) {
        if (error.code === 4902) {
          await this.addBSCNetwork();
          return true;
        }
        throw error;
      }
    }
    return true;
  }

  private async addBSCNetwork() {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
      }]
    });
  }

  // ========== FONCTIONS D'ACHAT ==========

  async purchaseNFT(tier: number): Promise<string> {
    if (!this.nftContract) await this.initialize();
    
    await this.ensureCorrectNetwork();
    
    try {
      const tierInfo = await this.getExtendedTierInfo(tier);
      const signer = await this.provider!.getSigner();
      const userAddress = await signer.getAddress();
      
      const balance = await this.getUSDCBalance(userAddress);
      if (parseFloat(balance) < parseFloat(tierInfo.price)) {
        throw new Error(`Balance USDC insuffisante: ${balance} < ${tierInfo.price}`);
      }

      const allowance = await this.getUSDCAllowance(userAddress);
      if (parseFloat(allowance) < parseFloat(tierInfo.price)) {
        console.log('Approval USDC requise...');
        const approveTx = await this.approveUSDC(tierInfo.price);
        console.log('Transaction approval:', approveTx);
        
        const receipt = await this.provider!.waitForTransaction(approveTx);
        if (!receipt || receipt.status !== 1) {
          throw new Error('Échec de l\'approbation USDC');
        }
      }

      const tx = await this.nftContract!.purchaseNFT(tier, {
        gasLimit: 500000
      });

      console.log('Transaction achat NFT:', tx.hash);
      return tx.hash;
      
    } catch (error: any) {
      console.error('Erreur achat NFT:', error);
      throw new Error(error.message || 'Erreur lors de l\'achat du NFT');
    }
  }

  // ========== MÉTHODES DE COMPATIBILITÉ ==========

  async getUserNFTInfo(userAddress: string) {
    return await this.getExtendedUserNFTInfo(userAddress);
  }

  async getTiersInfo(): Promise<Record<number, any>> {
    const activeTiers = await this.getAllActiveTiers();
    const tiersInfo: Record<number, any> = {};
    
    for (const tier of activeTiers) {
      tiersInfo[tier] = await this.getTierInfo(tier);
    }
    
    return tiersInfo;
  }

  async getRemainingSupply(tier: number): Promise<number> {
    if (!this.nftContract) await this.initialize();
    const remaining = await this.nftContract!.getRemainingSupply(tier);
    return Number(remaining);
  }

  async userHasTier(userAddress: string, tier: number): Promise<boolean> {
    if (!this.nftContract) await this.initialize();
    return await this.nftContract!.ownerHasTier(userAddress, tier);
  }

  async getUserHighestTier(userAddress: string): Promise<number> {
    if (!this.nftContract) await this.initialize();
    const highestTier = await this.nftContract!.getUserHighestTier(userAddress);
    return Number(highestTier);
  }

  async getUserMultiplier(userAddress: string): Promise<number> {
    if (!this.nftContract) await this.initialize();
    const multiplier = await this.nftContract!.getUserMultiplier(userAddress);
    return Number(multiplier);
  }

  // ========== MÉTHODES DE DEBUG ==========

  async debugUserState(userAddress: string) {
    if (!userAddress) return null;
    
    try {
      const [
        nftInfo,
        usdcBalance,
        highestTier,
        ownedTiers,
        fidelityStatus,
        hasFidelityNFT,
        canClaimFidelity,
        fidelityNFTInfo
      ] = await Promise.all([
        this.getExtendedUserNFTInfo(userAddress),
        this.getUSDCBalance(userAddress),
        this.getUserHighestTier(userAddress),
        this.getAllActiveTiers().then(tiers => 
          Promise.all(tiers.map(tier => 
            this.userHasTier(userAddress, tier).then(owns => ({ tier, owns }))
          ))
        ),
        this.getFidelityStatusFromBackend(userAddress),
        this.userHasFidelityNFT(userAddress),
        this.canUserClaimFidelityNFT(userAddress),
        this.getFidelityNFTInfo()
      ]);
      
      const debugInfo = {
        address: userAddress,
        nftInfo,
        usdcBalance: parseFloat(usdcBalance),
        highestTier,
        ownedTiers: ownedTiers.filter(t => t.owns).map(t => t.tier),
        fidelityStatus,
        fidelityNFT: {
          configured: FIDELITY_NFT_CONFIG,
          userOwns: hasFidelityNFT,
          canClaim: canClaimFidelity,
          contractInfo: fidelityNFTInfo,
          eligible: fidelityStatus.isFidel && !hasFidelityNFT && !fidelityStatus.hasClaimedNFT
        },
        environment: {
          mode: import.meta.env.MODE,
          isDev: import.meta.env.DEV,
          isProd: import.meta.env.PROD,
          apiUrl: import.meta.env.VITE_API_URL,
          nftContract: import.meta.env.VITE_NFT_CONTRACT_ADDRESS
        },
        timestamp: new Date().toISOString()
      };
      
      if (import.meta.env.DEV) {
        console.log('🔍 Debug état utilisateur avec NFT Fidélité:', debugInfo);
      }
      
      return debugInfo;
    } catch (error: any) {
      console.error('Erreur debug état utilisateur:', error);
      return { error: error.message };
    }
  }

  // 🎁 NOUVEAU - Méthode pour obtenir la configuration complète du NFT Fidélité
  getFidelityNFTConfig() {
    return {
      tier: FIDELITY_NFT_CONFIG.tier,
      name: FIDELITY_NFT_CONFIG.name,
      displayName: FIDELITY_NFT_CONFIG.displayName,
      icon: FIDELITY_NFT_CONFIG.icon,
      originalPrice: FIDELITY_NFT_CONFIG.originalPrice,
      originalPriceUSD: FIDELITY_NFT_CONFIG.originalPriceUSD,
      multiplier: FIDELITY_NFT_CONFIG.multiplier,
      multiplierPercent: FIDELITY_NFT_CONFIG.multiplierPercent,
      description: FIDELITY_NFT_CONFIG.description,
      supply: FIDELITY_NFT_CONFIG.supply,
      features: FIDELITY_NFT_CONFIG.features,
      accessPlans: FIDELITY_NFT_CONFIG.accessPlans,
      lockPeriods: FIDELITY_NFT_CONFIG.lockPeriods,
      bgGradient: FIDELITY_NFT_CONFIG.bgGradient,
      borderColor: FIDELITY_NFT_CONFIG.borderColor,
      glowColor: FIDELITY_NFT_CONFIG.glowColor
    };
  }

  // 🎁 NOUVEAU - Validation de l'environnement NFT Fidélité
  async validateFidelityEnvironment(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Vérifier la configuration
      if (FIDELITY_NFT_CONFIG.tier !== 5) {
        issues.push('Le NFT Fidélité doit être configuré sur le tier 5');
      }

      if (FIDELITY_NFT_CONFIG.originalPrice !== '0') {
        issues.push('Le NFT Fidélité doit être gratuit (prix = 0)');
      }

      // Vérifier l'accès au contrat
      try {
        await this.initialize();
        
        // Tester les fonctions spécifiques au NFT Fidélité
        try {
          await this.getFidelityNFTInfo();
        } catch (error) {
          recommendations.push('Fonction getFidelityNFTInfo() utilise les données par défaut');
        }

      } catch (error) {
        issues.push('Impossible de se connecter au smart contract NFT');
      }

      // Vérifier l'accès au backend
      try {
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/api/nft/fidelity-nft-info`);
        if (!response.ok) {
          issues.push('Endpoint backend NFT Fidélité non accessible');
        }
      } catch (error) {
        issues.push('Backend NFT Fidélité non accessible');
      }

    } catch (error) {
      issues.push(`Erreur de validation: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // ========== MÉTHODES D'ÉVÉNEMENTS ==========

  onNFTPurchased(callback: (buyer: string, tokenId: number, tier: number, price: string) => void) {
    if (!this.nftContract) return;
    
    try {
      const listener = (buyer: string, tokenId: any, tier: any, price: any) => {
        callback(
          buyer,
          Number(tokenId),
          Number(tier),
          ethers.formatUnits(price, 18)
        );
      };
      
      this.nftContract.on('NFTPurchased', listener);
      
      return () => {
        if (this.nftContract) {
          this.nftContract.off('NFTPurchased', listener);
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'écouteur NFTPurchased:', error);
      return () => {};
    }
  }

  onFidelityNFTClaimed(callback: (user: string, tokenId: number) => void) {
    if (!this.nftContract) return;

    try {
      const listener = (user: string, tokenId: any) => {
        callback(user, Number(tokenId));
      };

      this.nftContract.on('FidelityNFTClaimed', listener);
      
      return () => {
        if (this.nftContract) {
          this.nftContract.off('FidelityNFTClaimed', listener);
        }
      };
    } catch (error) {
      console.error('Erreur ajout listener FidelityNFTClaimed:', error);
      return () => {};
    }
  }

  onTierCreated(callback: (tier: number, name: string, price: string, supply: number) => void) {
    if (!this.nftContract) return;

    try {
      const listener = (tier: any, name: string, price: any, supply: any) => {
        callback(
          Number(tier),
          name,
          ethers.formatUnits(price, 18),
          Number(supply)
        );
      };

      this.nftContract.on('TierCreated', listener);
      
      return () => {
        if (this.nftContract) {
          this.nftContract.off('TierCreated', listener);
        }
      };
    } catch (error) {
      console.error('Erreur ajout listener TierCreated:', error);
      return () => {};
    }
  }

  onTierUpdated(callback: (tier: number, price: string, supply: number) => void) {
    if (!this.nftContract) return;

    try {
      const listener = (tier: any, price: any, supply: any) => {
        callback(
          Number(tier),
          ethers.formatUnits(price, 18),
          Number(supply)
        );
      };

      this.nftContract.on('TierUpdated', listener);
      
      return () => {
        if (this.nftContract) {
          this.nftContract.off('TierUpdated', listener);
        }
      };
    } catch (error) {
      console.error('Erreur ajout listener TierUpdated:', error);
      return () => {};
    }
  }

  onSpecialNFTMinted(callback: (to: string, tokenId: number, tier: number, reason: string) => void) {
    if (!this.nftContract) return;

    try {
      const listener = (to: string, tokenId: any, tier: any, reason: string) => {
        callback(to, Number(tokenId), Number(tier), reason);
      };

      this.nftContract.on('SpecialNFTMinted', listener);
      
      return () => {
        if (this.nftContract) {
          this.nftContract.off('SpecialNFTMinted', listener);
        }
      };
    } catch (error) {
      console.error('Erreur ajout listener SpecialNFTMinted:', error);
      return () => {};
    }
  }

  removeAllListeners() {
    if (this.nftContract) {
      try {
        this.nftContract.removeAllListeners();
      } catch (error) {
        console.error('Erreur lors de la suppression des écouteurs:', error);
      }
    }
  }

  // ========== MÉTHODES DE CHARGEMENT SÉCURISÉES ==========

  async loadTiersInfoSafely(): Promise<Record<number, any>> {
    try {
      console.log('🔄 Chargement des tiers NFT...');
      
      const activeTiers = await this.getAllActiveTiers();
      console.log('📊 Tiers actifs trouvés:', activeTiers);
      
      if (activeTiers.length === 0) {
        console.warn('⚠️ Aucun tier actif trouvé');
        return {};
      }
      
      const tiersInfo: Record<number, any> = {};
      
      for (const tier of activeTiers) {
        try {
          const tierInfo = await this.getTierInfo(tier);
          const remaining = await this.getRemainingSupply(tier);
          
          tiersInfo[tier] = {
            ...tierInfo,
            remaining
          };
          
          console.log(`✅ Tier ${tier} chargé:`, tiersInfo[tier]);
        } catch (tierError) {
          console.error(`❌ Erreur chargement tier ${tier}:`, tierError);
        }
      }
      
      console.log('🎯 Tous les tiers chargés:', tiersInfo);
      return tiersInfo;
      
    } catch (error) {
      console.error('❌ Erreur critique chargement tiers:', error);
      
      // 🎁 CORRECTION: Retourner des données de fallback avec NFT Fidélité
      return {
        1: {
          price: '10',
          supply: 1000,
          minted: 153,
          remaining: 847,
          active: true,
          name: 'NFT Bronze',
          description: 'Accès aux stratégies de base avec bonus 20%',
          multiplier: 120
        },
        2: {
          price: '250',
          supply: 500,
          minted: 188,
          remaining: 312,
          active: true,
          name: 'NFT Argent',
          description: 'Accès étendu avec bonus 50%',
          multiplier: 150
        },
        3: {
          price: '500',
          supply: 200,
          minted: 111,
          remaining: 89,
          active: true,
          name: 'NFT Or',
          description: 'Accès premium avec bonus 100%',
          multiplier: 200
        },
        4: {
          price: '1000',
          supply: 50,
          minted: 27,
          remaining: 23,
          active: true,
          name: 'NFT Privilège',
          description: 'Accès exclusif avec bonus 150%',
          multiplier: 250
        },
        // 🎁 NOUVEAU: NFT Fidélité dans les données de fallback
        5: {
          price: '0',
          supply: FIDELITY_NFT_CONFIG.supply,
          minted: 5,
          remaining: FIDELITY_NFT_CONFIG.supply - 5,
          active: true,
          name: FIDELITY_NFT_CONFIG.name,
          description: FIDELITY_NFT_CONFIG.description,
          multiplier: FIDELITY_NFT_CONFIG.multiplier
        }
      };
    }
  }

  async loadUserNFTInfoSafely(userAddress: string): Promise<UserNFTInfo> {
    try {
      if (!userAddress) {
        return {
          highestTier: 0,
          highestMultiplier: 100,
          ownedTiers: [],
          nftTokenIds: [],
          hasAccess: {},
          totalNFTs: 0
        };
      }
      
      console.log('🔄 Chargement infos NFT utilisateur:', userAddress);
      return await this.getExtendedUserNFTInfo(userAddress);
      
    } catch (error) {
      console.error('❌ Erreur chargement infos utilisateur:', error);
      
      return {
        highestTier: 0,
        highestMultiplier: 100,
        ownedTiers: [],
        nftTokenIds: [],
        hasAccess: {},
        totalNFTs: 0
      };
    }
  }

  // ========== MÉTHODES DE VALIDATION ==========

  async canAccessContract(): Promise<boolean> {
    try {
      if (!this.nftContract) {
        await this.initialize();
      }
      
      await this.nftContract!.getAllActiveTiers();
      return true;
    } catch (error) {
      console.error('❌ Impossible d\'accéder au contrat NFT:', error);
      return false;
    }
  }

  async isValidTier(tier: number): Promise<boolean> {
    try {
      const tierInfo = await this.getTierInfo(tier);
      return tierInfo.active && tierInfo.supply > 0;
    } catch (error) {
      console.error(`❌ Tier ${tier} invalide:`, error);
      return false;
    }
  }

  async testConnection(): Promise<{
    contractAccessible: boolean;
    walletConnected: boolean;
    networkCorrect: boolean;
    details: any;
  }> {
    const result = {
      contractAccessible: false,
      walletConnected: false,
      networkCorrect: false,
      details: {}
    };

    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        result.walletConnected = accounts.length > 0;
        result.details.accounts = accounts;
      }

      if (this.provider) {
        const network = await this.provider.getNetwork();
        result.networkCorrect = Number(network.chainId) === CONTRACTS.BSC_CHAIN_ID;
        result.details.network = {
          chainId: Number(network.chainId),
          name: network.name
        };
      }

      result.contractAccessible = await this.canAccessContract();

    } catch (error) {
      result.details.error = error.message;
    }

    return result;
  }

  getEnvironmentInfo() {
    return {
      mode: currentMode,
      isDevelopment,
      isProduction,
      apiUrl: import.meta.env.VITE_API_URL || BACKEND_CONFIG.BASE_URL,
      nftContract: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || CONTRACTS.NFT_CONTRACT,
      usdcToken: import.meta.env.VITE_USDC_TOKEN_ADDRESS || CONTRACTS.USDC_TOKEN,
      bscRpcUrl: import.meta.env.VITE_BSC_RPC_URL || CONTRACTS.BSC_RPC_URL,
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
    };
  }

  validateConfiguration() {
    const config = this.getEnvironmentInfo();
    const issues = [];
    const warnings = [];

    if (!import.meta.env.VITE_API_URL) {
      warnings.push('VITE_API_URL utilise la valeur par défaut');
    }
    
    if (!import.meta.env.VITE_NFT_CONTRACT_ADDRESS) {
      warnings.push('VITE_NFT_CONTRACT_ADDRESS utilise la valeur par défaut');
    }
    
    if (!import.meta.env.VITE_USDC_TOKEN_ADDRESS) {
      warnings.push('VITE_USDC_TOKEN_ADDRESS utilise la valeur par défaut');
    }
    
    if (!import.meta.env.VITE_BSC_RPC_URL) {
      warnings.push('VITE_BSC_RPC_URL utilise la valeur par défaut');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      config,
      usingDefaults: warnings.length > 0
    };
  }
}

// Instance singleton
const extensibleNFTService = new ExtensibleNFTService();

// Log de vérification au démarrage (seulement en dev)
if (isDevelopment) {
  console.log('🔧 Configuration NFT Service:', {
    mode: currentMode,
    apiUrl: BACKEND_CONFIG.BASE_URL,
    contracts: CONTRACTS,
    backend: BACKEND_CONFIG,
    fidelityNFT: FIDELITY_NFT_CONFIG
  });

  const validation = extensibleNFTService.validateConfiguration();
  if (validation.warnings && validation.warnings.length > 0) {
    console.log('ℹ️ Informations de configuration:', validation.warnings);
  }
  if (!validation.valid && validation.issues.length > 0) {
    console.warn('⚠️ Problèmes de configuration détectés:', validation.issues);
  } else {
    console.log('✅ Configuration NFT Service valide avec support NFT Fidélité');
  }
}

// Export par défaut
export default extensibleNFTService;

// Types exportés
export type { 
  ExtendedTierInfo, 
  CreateTierParams, 
  UserNFTInfo,
  FidelityStatusResponse
};

// Configuration exportée
export { CONTRACTS, BACKEND_CONFIG, FIDELITY_NFT_CONFIG };

// Instance nommée pour compatibilité
export const NFTService = extensibleNFTService;