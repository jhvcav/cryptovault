// services/NFTService.ts - Version complète corrigée pour Vite
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
}

class ExtensibleNFTService {
  private provider: ethers.BrowserProvider | null = null;
  private nftContract: ethers.Contract | null = null;
  private usdcContract: ethers.Contract | null = null;

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
  }> {
    try {
      const backendStatus = await this.getFidelityStatusFromBackend(walletAddress);
      const blockchainOwnsNFT = await this.userHasTier(walletAddress, 4);
      const consistent = backendStatus.hasClaimedNFT === blockchainOwnsNFT;

      return {
        consistent,
        dbStatus: backendStatus.hasClaimedNFT,
        blockchainStatus: blockchainOwnsNFT,
        recommendation: !consistent 
          ? 'Synchronisation requise - utiliser syncFidelityStatus()'
          : 'Statuts cohérents'
      };

    } catch (error) {
      console.error('Erreur vérification cohérence:', error);
      return {
        consistent: false,
        dbStatus: false,
        blockchainStatus: false,
        recommendation: 'Erreur - vérifier la connexion'
      };
    }
  }

  async claimFidelityNFT(userAddress: string): Promise<{
    success: boolean;
    txHash?: string;
    tokenId?: string;
    error?: string;
  }> {
    const result = await this.claimFidelityNFTViaBackend(userAddress);
    
    return {
      success: result.success,
      txHash: result.txHash,
      tokenId: result.tokenId,
      error: result.error
    };
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
        const tierInfo = await this.getExtendedTierInfo(tier);
        tierInfo.accessPlans.forEach(plan => allAccessiblePlans.add(plan));
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
        fidelityStatus
      ] = await Promise.all([
        this.getExtendedUserNFTInfo(userAddress),
        this.getUSDCBalance(userAddress),
        this.getUserHighestTier(userAddress),
        this.getAllActiveTiers().then(tiers => 
          Promise.all(tiers.map(tier => 
            this.userHasTier(userAddress, tier).then(owns => ({ tier, owns }))
          ))
        ),
        this.getFidelityStatusFromBackend(userAddress)
      ]);
      
      const debugInfo = {
        address: userAddress,
        nftInfo,
        usdcBalance: parseFloat(usdcBalance),
        highestTier,
        ownedTiers: ownedTiers.filter(t => t.owns).map(t => t.tier),
        fidelityStatus,
        environment: {
          mode: currentMode,
          isDev: isDevelopment,
          isProd: isProduction,
          apiUrl: import.meta.env.VITE_API_URL,
          nftContract: import.meta.env.VITE_NFT_CONTRACT_ADDRESS
        },
        timestamp: new Date().toISOString()
      };
      
      if (isDevelopment) {
        console.log('🔍 Debug état utilisateur:', debugInfo);
      }
      
      return debugInfo;
    } catch (error: any) {
      console.error('Erreur debug état utilisateur:', error);
      return { error: error.message };
    }
  }

  // ========== MÉTHODES D'ÉVÉNEMENTS MANQUANTES ==========

  /**
   * Écouter les achats de NFT
   */
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
      return () => {}; // Retourner une fonction vide en cas d'erreur
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

  /**
   * Charger les infos des tiers avec gestion d'erreur
   */
  async loadTiersInfoSafely(): Promise<Record<number, any>> {
    try {
      console.log('🔄 Chargement des tiers NFT...');
      
      // Essayer de charger les tiers actifs
      const activeTiers = await this.getAllActiveTiers();
      console.log('📊 Tiers actifs trouvés:', activeTiers);
      
      if (activeTiers.length === 0) {
        console.warn('⚠️ Aucun tier actif trouvé');
        return {};
      }
      
      const tiersInfo: Record<number, any> = {};
      
      // Charger chaque tier individuellement avec gestion d'erreur
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
          // Continuer avec les autres tiers
        }
      }
      
      console.log('🎯 Tous les tiers chargés:', tiersInfo);
      return tiersInfo;
      
    } catch (error) {
      console.error('❌ Erreur critique chargement tiers:', error);
      
      // Retourner des données de fallback si le contrat n'est pas accessible
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
        }
      };
    }
  }

  /**
   * Charger les infos utilisateur avec gestion d'erreur
   */
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
      
      // Retourner des données vides en cas d'erreur
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

  /**
   * Vérifier si le service peut accéder au contrat
   */
  async canAccessContract(): Promise<boolean> {
    try {
      if (!this.nftContract) {
        await this.initialize();
      }
      
      // Test simple : essayer de lire les tiers actifs
      await this.nftContract!.getAllActiveTiers();
      return true;
    } catch (error) {
      console.error('❌ Impossible d\'accéder au contrat NFT:', error);
      return false;
    }
  }

  /**
   * Vérifier si un tier existe et est valide
   */
  async isValidTier(tier: number): Promise<boolean> {
    try {
      const tierInfo = await this.getTierInfo(tier);
      return tierInfo.active && tierInfo.supply > 0;
    } catch (error) {
      console.error(`❌ Tier ${tier} invalide:`, error);
      return false;
    }
  }

  /**
   * Méthode pour tester la connectivité
   */
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
      // Test wallet
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        result.walletConnected = accounts.length > 0;
        result.details.accounts = accounts;
      }

      // Test network
      if (this.provider) {
        const network = await this.provider.getNetwork();
        result.networkCorrect = Number(network.chainId) === CONTRACTS.BSC_CHAIN_ID;
        result.details.network = {
          chainId: Number(network.chainId),
          name: network.name
        };
      }

      // Test contract
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
      apiUrl: import.meta.env.VITE_API_URL,
      nftContract: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
      usdcToken: import.meta.env.VITE_USDC_TOKEN_ADDRESS,
      bscRpcUrl: import.meta.env.VITE_BSC_RPC_URL,
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
    };
  }

  validateConfiguration() {
    const config = this.getEnvironmentInfo();
    const issues = [];

    if (!config.apiUrl) {
      issues.push('VITE_API_URL manquante');
    }
    
    if (!config.nftContract || !config.nftContract.startsWith('0x')) {
      issues.push('VITE_NFT_CONTRACT_ADDRESS invalide');
    }
    
    if (!config.usdcToken || !config.usdcToken.startsWith('0x')) {
      issues.push('VITE_USDC_TOKEN_ADDRESS invalide');
    }
    
    if (!config.bscRpcUrl || !config.bscRpcUrl.startsWith('http')) {
      issues.push('VITE_BSC_RPC_URL invalide');
    }

    return {
      valid: issues.length === 0,
      issues,
      config
    };
  }
} // ← ACCOLADE FERMANTE DE LA CLASSE

// Log de vérification au démarrage (seulement en dev)
if (isDevelopment) {
  console.log('🔧 Configuration NFT Service:', {
    mode: currentMode,
    apiUrl: import.meta.env.VITE_API_URL,
    contracts: CONTRACTS,
    backend: BACKEND_CONFIG
  });
}

// Fonction de validation standalone
function validateEnvironmentConfiguration() {
  const config = {
    mode: currentMode,
    isDevelopment,
    isProduction,
    apiUrl: import.meta.env.VITE_API_URL,
    nftContract: import.meta.env.VITE_NFT_CONTRACT_ADDRESS,
    usdcToken: import.meta.env.VITE_USDC_TOKEN_ADDRESS,
    bscRpcUrl: import.meta.env.VITE_BSC_RPC_URL,
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
  };

  const issues = [];

  if (!config.apiUrl) {
    issues.push('VITE_API_URL manquante dans .env');
  }
  
  if (!config.nftContract || !config.nftContract.startsWith('0x')) {
    issues.push('VITE_NFT_CONTRACT_ADDRESS invalide ou manquante dans .env');
  }
  
  if (!config.usdcToken || !config.usdcToken.startsWith('0x')) {
    issues.push('VITE_USDC_TOKEN_ADDRESS invalide ou manquante dans .env');
  }
  
  if (!config.bscRpcUrl || !config.bscRpcUrl.startsWith('http')) {
    issues.push('VITE_BSC_RPC_URL invalide ou manquante dans .env');
  }

  return {
    valid: issues.length === 0,
    issues,
    config
  };
}

// Instance singleton
const extensibleNFTService = new ExtensibleNFTService();

// Validation de la configuration au démarrage
if (isDevelopment) {
  const validation = validateEnvironmentConfiguration();
  if (!validation.valid) {
    console.warn('⚠️ Problèmes de configuration détectés:', validation.issues);
    console.warn('📝 Vérifiez votre fichier .env et assurez-vous que toutes les variables VITE_* sont définies');
  } else {
    console.log('✅ Configuration NFT Service valide');
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
export { CONTRACTS, BACKEND_CONFIG };

// Instance nommée pour compatibilité
export const NFTService = extensibleNFTService;

// Export de la fonction de validation pour usage externe
export { validateEnvironmentConfiguration };