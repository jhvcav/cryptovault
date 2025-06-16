// services/NFTService.ts - Version extensible corrigée pour ethers v6
import { ethers } from 'ethers';

// ABI étendu du contrat NFT
const NFT_CONTRACT_ABI = [
  // Fonctions d'achat existantes
  "function purchaseNFT(uint256 tier) external",
  "function claimFidelityNFT(address fidelUser) external",
  
  // Nouvelles fonctions pour les tiers dynamiques
  "function createNewTier(string name, string description, uint256 price, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans, bool isSpecial) external returns (uint256)",
  "function createEventNFT(string name, string description, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans) external returns (uint256)",
  "function createPartnershipNFT(string partnerName, string description, uint256 price, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans) external returns (uint256)",
  "function mintSpecialNFT(address to, uint256 tier, string reason) external",
  "function updateTier(uint256 tier, uint256 newPrice, uint256 newSupply, bool active) external",
  "function addAccessPlansToTier(uint256 tier, string[] newPlans) external",
  
  // Fonctions de lecture étendues
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
  
  // Events
  "event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 tier, uint256 price)",
  "event TierCreated(uint256 indexed tier, string name, uint256 price, uint256 supply)",
  "event TierUpdated(uint256 indexed tier, uint256 price, uint256 supply)",
  "event FidelityNFTClaimed(address indexed user, uint256 indexed tokenId)",
  "event SpecialNFTMinted(address indexed to, uint256 indexed tokenId, uint256 tier, string reason)"
];

// ABI du token USDC (inchangé)
const USDC_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Adresses des contrats sur BSC Mainnet
const CONTRACTS = {
  NFT_CONTRACT: '0x3b9E6cad77E65e153321C91Ac5225a4C564b3aE4', // adresse du contrat déployé
  USDC_TOKEN: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC sur BSC
  BSC_CHAIN_ID: 56,
  BSC_RPC_URL: 'https://bsc-dataseed.binance.org/'
  // Ou essayez ces alternatives si vous avez des problèmes:
  // BSC_RPC_URL: 'https://bsc-dataseed1.defibit.io/'
  // BSC_RPC_URL: 'https://bsc-dataseed1.ninicoin.io/'
};

// Interfaces étendues
interface ExtendedTierInfo {
  price: string;
  supply: number;
  minted: number;
  remaining: number;
  baseURI: string;
  active: boolean;
  name: string;
  description: string;
  multiplier: number; // En centièmes (120 = 1.2x)
  multiplierDisplay: string; // Format affiché (1.2x)
  accessPlans: string[];
  createdAt: number;
  isSpecial: boolean;
}

interface CreateTierParams {
  name: string;
  description: string;
  price: string; // En USDC
  supply: number;
  multiplier: number; // En centièmes (120 = 1.2x)
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

class ExtensibleNFTService {
  private provider: ethers.BrowserProvider | null = null;
  private nftContract: ethers.Contract | null = null;
  private usdcContract: ethers.Contract | null = null;

  // Initialiser les contrats
  async initialize() {
  if (!window.ethereum) {
    throw new Error('Metamask non détecté');
  }

  try {
    // ethers.js v6 a une API différente pour BrowserProvider
    // Pas besoin d'options de polling, elles sont gérées différemment
    this.provider = new ethers.BrowserProvider(window.ethereum);
    
    // Configurer un délai d'attente plus long pour les requêtes
    // Cela peut aider avec les erreurs de limite RPC
    this.provider.getNetwork = async () => {
      try {
        // Implémentation avec timeout plus long
        const networkPromise = ethers.getDefaultProvider(CONTRACTS.BSC_RPC_URL).getNetwork();
        const network = await networkPromise;
        return network;
      } catch (error) {
        console.error('Erreur getNetwork:', error);
        // Fallback en cas d'erreur
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

  // ========== FONCTIONS DE LECTURE ÉTENDUES ==========

  // Obtenir tous les tiers actifs
  async getAllActiveTiers(): Promise<number[]> {
    if (!this.nftContract) await this.initialize();
    
    const tiers = await this.nftContract!.getAllActiveTiers();
    return tiers.map((tier: any) => Number(tier));
  }

  // Obtenir les tiers spéciaux
  async getSpecialTiers(): Promise<number[]> {
    if (!this.nftContract) await this.initialize();
    
    const specialTiers = await this.nftContract!.getSpecialTiers();
    return specialTiers.map((tier: any) => Number(tier));
  }

  // Obtenir les infos de base d'un tier (compatibilité)
  async getTierInfo(tier: number) {
    if (!this.nftContract) await this.initialize();
    
    const tierInfo = await this.nftContract!.getTierInfo(tier);
    
    return {
      price: ethers.formatEther(tierInfo.price),
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
  }

  // Obtenir les infos étendues d'un tier
  async getExtendedTierInfo(tier: number): Promise<ExtendedTierInfo> {
    if (!this.nftContract) await this.initialize();
    
    const tierInfo = await this.nftContract!.getTierInfo(tier);
    const remaining = await this.nftContract!.getRemainingSupply(tier);
    const isSpecial = await this.nftContract!.isSpecialTier(tier);
    
    const multiplierValue = Number(tierInfo.multiplier);
    
    return {
      price: ethers.formatEther(tierInfo.price),
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
  }

  // Obtenir toutes les infos des tiers actifs
  async getAllTiersInfo(): Promise<Record<number, ExtendedTierInfo>> {
    const activeTiers = await this.getAllActiveTiers();
    const tiersInfo: Record<number, ExtendedTierInfo> = {};
    
    for (const tier of activeTiers) {
      tiersInfo[tier] = await this.getExtendedTierInfo(tier);
    }
    
    return tiersInfo;
  }

  // Obtenir les infos NFT étendues d'un utilisateur
  async getExtendedUserNFTInfo(userAddress: string): Promise<UserNFTInfo> {
    if (!this.nftContract) await this.initialize();

    const highestTier = await this.nftContract!.getUserHighestTier(userAddress);
    const userMultiplier = await this.nftContract!.getUserMultiplier(userAddress);
    
    // Obtenir tous les tiers actifs pour vérifier possession
    const activeTiers = await this.getAllActiveTiers();
    const ownedTiers: number[] = [];
    
    for (const tier of activeTiers) {
      const hasTier = await this.nftContract!.ownerHasTier(userAddress, tier);
      if (hasTier) {
        ownedTiers.push(tier);
      }
    }

    // Obtenir les token IDs
    const balance = await this.nftContract!.balanceOf(userAddress);
    const nftTokenIds: number[] = [];
    
    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await this.nftContract!.tokenOfOwnerByIndex(userAddress, i);
      nftTokenIds.push(Number(tokenId));
    }

    // Déterminer les accès aux plans
    const hasAccess: { [planName: string]: boolean } = {};
    
    if (ownedTiers.length > 0) {
      // Obtenir tous les plans accessibles via les NFT possédés
      const allAccessiblePlans = new Set<string>();
      
      for (const tier of ownedTiers) {
        const tierInfo = await this.getExtendedTierInfo(tier);
        tierInfo.accessPlans.forEach(plan => allAccessiblePlans.add(plan));
      }
      
      // Convertir en objet d'accès
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

  // ========== FONCTIONS D'ACHAT ==========

  async purchaseNFT(tier: number): Promise<string> {
    if (!this.nftContract) await this.initialize();
    
    await this.ensureCorrectNetwork();
    
    // Obtenir les infos du tier
    const tierInfo = await this.getExtendedTierInfo(tier);
    const signer = await this.provider!.getSigner();
    const userAddress = await signer.getAddress();
    
    // Vérifier la balance USDC
    const balance = await this.getUSDCBalance(userAddress);
    if (parseFloat(balance) < parseFloat(tierInfo.price)) {
      throw new Error('Balance USDC insuffisante');
    }

    // Vérifier l'allowance
    const allowance = await this.getUSDCAllowance(userAddress);
    if (parseFloat(allowance) < parseFloat(tierInfo.price)) {
      // Approuver d'abord
      const approveTx = await this.approveUSDC(tierInfo.price);
      await this.provider!.waitForTransaction(approveTx);
    }

    // Acheter le NFT
    const tx = await this.nftContract!.purchaseNFT(tier, {
      gasLimit: 500000
    });

    return tx.hash;
  }

  async claimFidelityNFT(userAddress: string): Promise<string> {
    if (!this.nftContract) await this.initialize();
    
    await this.ensureCorrectNetwork();
    
    const tx = await this.nftContract!.claimFidelityNFT(userAddress, {
      gasLimit: 500000
    });

    return tx.hash;
  }

  // ========== FONCTIONS D'ADMINISTRATION POUR NOUVEAUX TIERS ==========

  /**
   * Créer un nouveau tier NFT (fonction admin)
   */
  async createNewTier(params: CreateTierParams): Promise<{ success: boolean; tierId?: number; txHash?: string; error?: string }> {
    if (!this.nftContract) await this.initialize();

    try {
      await this.ensureCorrectNetwork();

      const priceWei = ethers.parseEther(params.price);
      
      const tx = await this.nftContract!.createNewTier(
        params.name,
        params.description,
        priceWei,
        params.supply,
        params.multiplier,
        params.baseURI,
        params.accessPlans,
        params.isSpecial || false,
        {
          gasLimit: 500000
        }
      );

      const receipt = await this.provider!.waitForTransaction(tx.hash);
      
      // Extraire le tier ID du log d'événement
      const tierCreatedEvent = receipt?.logs.find(log => {
        try {
          const parsedLog = this.nftContract!.interface.parseLog(log);
          return parsedLog?.name === 'TierCreated';
        } catch {
          return false;
        }
      });

      let tierId;
      if (tierCreatedEvent) {
        const parsedLog = this.nftContract!.interface.parseLog(tierCreatedEvent);
        tierId = Number(parsedLog?.args.tier);
      }

      return {
        success: true,
        tierId,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('Erreur création tier:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du tier'
      };
    }
  }

  /**
   * Créer un NFT d'événement (gratuit)
   */
  async createEventNFT(params: {
    name: string;
    description: string;
    supply: number;
    multiplier: number;
    baseURI: string;
    accessPlans: string[];
  }): Promise<{ success: boolean; tierId?: number; txHash?: string; error?: string }> {
    if (!this.nftContract) await this.initialize();

    try {
      await this.ensureCorrectNetwork();

      const tx = await this.nftContract!.createEventNFT(
        params.name,
        params.description,
        params.supply,
        params.multiplier,
        params.baseURI,
        params.accessPlans,
        {
          gasLimit: 500000
        }
      );

      const receipt = await this.provider!.waitForTransaction(tx.hash);
      
      // Extraire le tier ID du log d'événement
      const tierCreatedEvent = receipt?.logs.find(log => {
        try {
          const parsedLog = this.nftContract!.interface.parseLog(log);
          return parsedLog?.name === 'TierCreated';
        } catch {
          return false;
        }
      });

      let tierId;
      if (tierCreatedEvent) {
        const parsedLog = this.nftContract!.interface.parseLog(tierCreatedEvent);
        tierId = Number(parsedLog?.args.tier);
      }

      return {
        success: true,
        tierId,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('Erreur création NFT événement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du NFT événement'
      };
    }
  }

  /**
   * Créer un NFT de partenariat
   */
  async createPartnershipNFT(params: {
    partnerName: string;
    description: string;
    price: string;
    supply: number;
    multiplier: number;
    baseURI: string;
    accessPlans: string[];
  }): Promise<{ success: boolean; tierId?: number; txHash?: string; error?: string }> {
    if (!this.nftContract) await this.initialize();

    try {
      await this.ensureCorrectNetwork();

      const priceWei = ethers.parseEther(params.price);

      const tx = await this.nftContract!.createPartnershipNFT(
        params.partnerName,
        params.description,
        priceWei,
        params.supply,
        params.multiplier,
        params.baseURI,
        params.accessPlans,
        {
          gasLimit: 500000
        }
      );

      const receipt = await this.provider!.waitForTransaction(tx.hash);
      
      // Extraire le tier ID du log d'événement
      const tierCreatedEvent = receipt?.logs.find(log => {
        try {
          const parsedLog = this.nftContract!.interface.parseLog(log);
          return parsedLog?.name === 'TierCreated';
        } catch {
          return false;
        }
      });

      let tierId;
      if (tierCreatedEvent) {
        const parsedLog = this.nftContract!.interface.parseLog(tierCreatedEvent);
        tierId = Number(parsedLog?.args.tier);
      }

      return {
        success: true,
        tierId,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('Erreur création NFT partenariat:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du NFT partenariat'
      };
    }
  }

  /**
   * Minter un NFT spécial directement à un utilisateur
   */
  async mintSpecialNFT(params: {
    to: string;
    tier: number;
    reason: string;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.nftContract) await this.initialize();

    try {
      await this.ensureCorrectNetwork();

      const tx = await this.nftContract!.mintSpecialNFT(
        params.to,
        params.tier,
        params.reason,
        {
          gasLimit: 300000
        }
      );

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('Erreur mint NFT spécial:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du mint du NFT spécial'
      };
    }
  }

  /**
   * Mettre à jour un tier existant
   */
  async updateTier(params: {
    tier: number;
    newPrice: string;
    newSupply: number;
    active: boolean;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.nftContract) await this.initialize();

    try {
      await this.ensureCorrectNetwork();

      const priceWei = ethers.parseEther(params.newPrice);

      const tx = await this.nftContract!.updateTier(
        params.tier,
        priceWei,
        params.newSupply,
        params.active,
        {
          gasLimit: 200000
        }
      );

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('Erreur mise à jour tier:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du tier'
      };
    }
  }

  /**
   * Ajouter des plans d'accès à un tier
   */
  async addAccessPlansToTier(params: {
    tier: number;
    newPlans: string[];
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.nftContract) await this.initialize();

    try {
      await this.ensureCorrectNetwork();

      const tx = await this.nftContract!.addAccessPlansToTier(
        params.tier,
        params.newPlans,
        {
          gasLimit: 200000
        }
      );

      return {
        success: true,
        txHash: tx.hash
      };

    } catch (error: any) {
      console.error('Erreur ajout plans:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'ajout des plans'
      };
    }
  }

  // ========== MÉTHODES DE COMPATIBILITÉ ==========

  // Alias pour compatibilité avec les hooks existants
  async getUserNFTInfo(userAddress: string) {
    return await this.getExtendedUserNFTInfo(userAddress);
  }

  // Méthode pour obtenir les infos de base des tiers (compatibilité)
  async getTiersInfo(): Promise<Record<number, any>> {
    const activeTiers = await this.getAllActiveTiers();
    const tiersInfo: Record<number, any> = {};
    
    for (const tier of activeTiers) {
      tiersInfo[tier] = await this.getTierInfo(tier);
    }
    
    return tiersInfo;
  }

  // Obtenir le supply restant d'un tier
  async getRemainingSupply(tier: number): Promise<number> {
    if (!this.nftContract) await this.initialize();
    
    const remaining = await this.nftContract!.getRemainingSupply(tier);
    return Number(remaining);
  }

  // Vérifier si un utilisateur possède un tier spécifique
  async userHasTier(userAddress: string, tier: number): Promise<boolean> {
    if (!this.nftContract) await this.initialize();
    
    return await this.nftContract!.ownerHasTier(userAddress, tier);
  }

  // Obtenir le tier le plus élevé d'un utilisateur
  async getUserHighestTier(userAddress: string): Promise<number> {
    if (!this.nftContract) await this.initialize();
    
    const highestTier = await this.nftContract!.getUserHighestTier(userAddress);
    return Number(highestTier);
  }

  // Obtenir le multiplicateur d'un utilisateur
  async getUserMultiplier(userAddress: string): Promise<number> {
    if (!this.nftContract) await this.initialize();
    
    const multiplier = await this.nftContract!.getUserMultiplier(userAddress);
    return Number(multiplier);
  }

  // Obtenir le nombre de NFT d'un utilisateur
  async getUserNFTCount(userAddress: string): Promise<number> {
    if (!this.nftContract) await this.initialize();
    
    const balance = await this.nftContract!.balanceOf(userAddress);
    return Number(balance);
  }

  // Obtenir tous les token IDs d'un utilisateur
  async getUserTokenIds(userAddress: string): Promise<number[]> {
    if (!this.nftContract) await this.initialize();
    
    const balance = await this.getUserNFTCount(userAddress);
    const tokenIds: number[] = [];
    
    for (let i = 0; i < balance; i++) {
      const tokenId = await this.nftContract!.tokenOfOwnerByIndex(userAddress, i);
      tokenIds.push(Number(tokenId));
    }
    
    return tokenIds;
  }

  // Obtenir le tier d'un token ID spécifique
  async getTokenTier(tokenId: number): Promise<number> {
    if (!this.nftContract) await this.initialize();
    
    const tier = await this.nftContract!.nftToTier(tokenId);
    return Number(tier);
  }

  // Vérifier si un tier est spécial
  async isSpecialTier(tier: number): Promise<boolean> {
    if (!this.nftContract) await this.initialize();
    
    return await this.nftContract!.isSpecialTier(tier);
  }

  // Obtenir les plans d'accès d'un tier
  async getTierAccessPlans(tier: number): Promise<string[]> {
    if (!this.nftContract) await this.initialize();
    
    return await this.nftContract!.getTierAccessPlans(tier);
  }

  // Version simplifiée pour les hooks qui attendent un format spécifique
  async getSimpleTierInfo(tier: number) {
    const tierInfo = await this.getTierInfo(tier);
    const remaining = await this.getRemainingSupply(tier);
    
    return {
      ...tierInfo,
      remaining,
      priceFormatted: `${tierInfo.price} USDC`,
      multiplierFormatted: `${(tierInfo.multiplier / 100).toFixed(1)}x`
    };
  }

  // Version simplifiée pour les infos utilisateur
  async getSimpleUserInfo(userAddress: string) {
    const extendedInfo = await this.getExtendedUserNFTInfo(userAddress);
    
    return {
      highestTier: extendedInfo.highestTier,
      multiplier: extendedInfo.highestMultiplier,
      totalNFTs: extendedInfo.totalNFTs,
      ownedTiers: extendedInfo.ownedTiers,
      hasNFT: extendedInfo.totalNFTs > 0,
      accessPlans: Object.keys(extendedInfo.hasAccess)
    };
  }

  // ========== FONCTIONS UTILITAIRES ==========

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

  async getUSDCBalance(userAddress: string): Promise<string> {
    if (!this.usdcContract) await this.initialize();
    
    const balance = await this.usdcContract!.balanceOf(userAddress);
    return ethers.formatEther(balance);
  }

  async getUSDCAllowance(userAddress: string): Promise<string> {
    if (!this.usdcContract) await this.initialize();
    
    const allowance = await this.usdcContract!.allowance(userAddress, CONTRACTS.NFT_CONTRACT);
    return ethers.formatEther(allowance);
  }

  async approveUSDC(amount: string): Promise<string> {
    if (!this.usdcContract) await this.initialize();
    
    const amountWei = ethers.parseEther(amount);
    const tx = await this.usdcContract!.approve(CONTRACTS.NFT_CONTRACT, amountWei);
    
    return tx.hash;
  }

  // ========== FONCTIONS DE FILTRAGE ET TRI ==========

  /**
   * Filtrer les tiers par critères
   */
  async filterTiers(criteria: {
    priceMin?: number;
    priceMax?: number;
    multiplierMin?: number;
    multiplierMax?: number;
    accessPlans?: string[];
    specialOnly?: boolean;
    activeOnly?: boolean;
  }): Promise<number[]> {
    const allTiers = await this.getAllActiveTiers();
    const filteredTiers: number[] = [];

    for (const tier of allTiers) {
      const tierInfo = await this.getExtendedTierInfo(tier);
      
      // Vérifier les critères
      if (criteria.priceMin !== undefined && parseFloat(tierInfo.price) < criteria.priceMin) continue;
      if (criteria.priceMax !== undefined && parseFloat(tierInfo.price) > criteria.priceMax) continue;
      if (criteria.multiplierMin !== undefined && tierInfo.multiplier < criteria.multiplierMin) continue;
      if (criteria.multiplierMax !== undefined && tierInfo.multiplier > criteria.multiplierMax) continue;
      if (criteria.activeOnly && !tierInfo.active) continue;
      if (criteria.specialOnly !== undefined && tierInfo.isSpecial !== criteria.specialOnly) continue;
      
      if (criteria.accessPlans && criteria.accessPlans.length > 0) {
        const hasRequiredPlans = criteria.accessPlans.every(plan => 
          tierInfo.accessPlans.includes(plan)
        );
        if (!hasRequiredPlans) continue;
      }

      filteredTiers.push(tier);
    }

    return filteredTiers;
  }

  /**
   * Trier les tiers par critère
   */
  async sortTiers(tiers: number[], sortBy: 'price' | 'multiplier' | 'supply' | 'remaining' | 'created', ascending: boolean = true): Promise<number[]> {
    const tierInfos = await Promise.all(
      tiers.map(async tier => ({
        tier,
        info: await this.getExtendedTierInfo(tier)
      }))
    );

    tierInfos.sort((a, b) => {
      let valueA: number, valueB: number;

      switch (sortBy) {
        case 'price':
          valueA = parseFloat(a.info.price);
          valueB = parseFloat(b.info.price);
          break;
        case 'multiplier':
          valueA = a.info.multiplier;
          valueB = b.info.multiplier;
          break;
        case 'supply':
          valueA = a.info.supply;
          valueB = b.info.supply;
          break;
        case 'remaining':
          valueA = a.info.remaining;
          valueB = b.info.remaining;
          break;
        case 'created':
          valueA = a.info.createdAt;
          valueB = b.info.createdAt;
          break;
        default:
          return 0;
      }

      return ascending ? valueA - valueB : valueB - valueA;
    });

    return tierInfos.map(item => item.tier);
  }

  // ========== ÉVÉNEMENTS ==========

  onTierCreated(callback: (tier: number, name: string, price: string, supply: number) => void) {
    if (!this.nftContract) return;

    this.nftContract.on('TierCreated', (tier, name, price, supply, event) => {
      callback(
        Number(tier),
        name,
        ethers.formatEther(price),
        Number(supply)
      );
    });
  }

  onTierUpdated(callback: (tier: number, price: string, supply: number) => void) {
    if (!this.nftContract) return;

    this.nftContract.on('TierUpdated', (tier, price, supply, event) => {
      callback(
        Number(tier),
        ethers.formatEther(price),
        Number(supply)
      );
    });
  }

  onSpecialNFTMinted(callback: (to: string, tokenId: number, tier: number, reason: string) => void) {
    if (!this.nftContract) return;

    this.nftContract.on('SpecialNFTMinted', (to, tokenId, tier, reason, event) => {
      callback(to, Number(tokenId), Number(tier), reason);
    });
  }

  onNFTPurchased(callback) {
  if (!this.nftContract) return;
  
  try {
    // Stocker la référence de l'écouteur pour pouvoir le supprimer plus tard
    const listener = (buyer, tokenId, tier, price, event) => {
      callback(
        buyer,
        Number(tokenId),
        Number(tier),
        ethers.formatEther(price)
      );
    };
    
    this.nftContract.on('NFTPurchased', listener);
    
    // Retourner une fonction pour supprimer cet écouteur spécifique
    return () => {
      this.nftContract.off('NFTPurchased', listener);
    };
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'écouteur NFTPurchased:', error);
  }
}

  onFidelityNFTClaimed(callback: (user: string, tokenId: number) => void) {
    if (!this.nftContract) return;

    this.nftContract.on('FidelityNFTClaimed', (user, tokenId, event) => {
      callback(user, Number(tokenId));
    });
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

  // ========== FONCTIONS D'ESTIMATION ==========

  async estimateGasForPurchase(tier: number): Promise<string> {
    if (!this.nftContract) await this.initialize();
    
    try {
      const gasEstimate = await this.nftContract!.purchaseNFT.estimateGas(tier);
      const feeData = await this.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;
      const gasCost = gasEstimate * gasPrice;
      
      return ethers.formatEther(gasCost);
    } catch (error) {
      console.error('Erreur estimation gas:', error);
      return '0.001';
    }
  }

  async estimateGasForTierCreation(): Promise<string> {
    if (!this.provider) await this.initialize();
    
    try {
      const feeData = await this.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;
      const estimatedGas = 500000n; // Estimation basée sur la complexité
      const gasCost = estimatedGas * gasPrice;
      
      return ethers.formatEther(gasCost);
    } catch (error) {
      console.error('Erreur estimation gas création:', error);
      return '0.01';
    }
  }
}

// Instance singleton
const extensibleNFTService = new ExtensibleNFTService();

export default extensibleNFTService;

// Types exportés
export type { 
  ExtendedTierInfo, 
  CreateTierParams, 
  UserNFTInfo 
};

// Configuration exportée
export { CONTRACTS };

export const NFTService = extensibleNFTService;