import { ethers } from 'ethers';

// Adresses des contrats
const ADDRESSES = {
  CRYPTO_VAULT_STAKING: "0x719fd9F511DDc561D03801161742D84ECb9445e9",
  CAKE_STRATEGY_USDC: "0x3A9f7FA2dCFFBfAC8732E13AA0D4ba56D7708836",
  CAKE_STRATEGY_USDT: "0xEb680C41D5bb5eD5A241aF0Cb2285E29AE00b231",
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  CAKE_TOKEN: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
};

// ABI corrigé des contrats
const strategyABI = [
  // Variables publiques
  "function depositedAmount() external view returns (uint256)",
  "function stakedCakeAmount() external view returns (uint256)",
  "function totalRewardsHarvested() external view returns (uint256)",
  "function isActive() external view returns (bool)",
  
  // Méthodes d'action
  "function deposit(uint256 _amount, uint256 _lockDuration) external",
  "function withdraw(uint256 _amount) external",
  "function harvest() external",
  "function emergencyExit() external"
];

const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)"
];

const cryptoVaultStakingABI = [
  "function adminWithdraw(address _token, uint256 _amount) external",
  "function adminWithdrawAll(address _token) external",
  "function owner() view returns (address)"
];

/**
 * Service pour gérer les interactions avec les stratégies de staking
 */
export const strategyService = {
  /**
   * Déploie des fonds vers une stratégie
   */
  deployToStrategy: async (tokenSymbol, amount, signer, stakingContract) => {
    try {
      const tokenAddress = tokenSymbol === 'USDC' ? ADDRESSES.USDC_TOKEN : ADDRESSES.USDT_TOKEN;
      const strategyAddress = tokenSymbol === 'USDC' ? ADDRESSES.CAKE_STRATEGY_USDC : ADDRESSES.CAKE_STRATEGY_USDT;
      
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const strategyContract = new ethers.Contract(strategyAddress, strategyABI, signer);
      
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      
      console.log(`Retrait de ${amount} ${tokenSymbol} du contrat principal...`);
      const tx1 = await stakingContract.adminWithdraw(tokenAddress, amountInWei);
      await tx1.wait();
      
      console.log(`Approbation de ${amount} ${tokenSymbol} pour la stratégie...`);
      const tx2 = await tokenContract.approve(strategyAddress, amountInWei);
      await tx2.wait();
      
      console.log(`Dépôt de ${amount} ${tokenSymbol} dans la stratégie...`);
      const tx3 = await strategyContract.deposit(amountInWei, 0);
      await tx3.wait();
      
      return {
        success: true,
        message: `${amount} ${tokenSymbol} déployés avec succès dans la stratégie`
      };
    } catch (error) {
      console.error("Erreur lors du déploiement des fonds:", error);
      return {
        success: false,
        message: error.message || "Erreur lors du déploiement des fonds"
      };
    }
  },
  
  /**
   * Récolte les récompenses d'une stratégie
   */
  harvestRewards: async (strategyAddress, signer) => {
    try {
      const strategyContract = new ethers.Contract(strategyAddress, strategyABI, signer);
      
      const tx = await strategyContract.harvest();
      await tx.wait();
      
      return {
        success: true,
        message: "Récompenses récoltées avec succès"
      };
    } catch (error) {
      console.error("Erreur lors de la récolte des récompenses:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la récolte des récompenses"
      };
    }
  },
  
  /**
   * Retire des fonds d'une stratégie
   */
  withdrawFromStrategy: async (strategyAddress, amount, decimals, signer) => {
    try {
      const strategyContract = new ethers.Contract(strategyAddress, strategyABI, signer);
      
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      const tx = await strategyContract.withdraw(amountInWei);
      await tx.wait();
      
      return {
        success: true,
        message: `${amount} retirés avec succès de la stratégie`
      };
    } catch (error) {
      console.error("Erreur lors du retrait des fonds:", error);
      return {
        success: false,
        message: error.message || "Erreur lors du retrait des fonds"
      };
    }
  },
  
  /**
   * Exécute un retrait d'urgence
   */
  emergencyExit: async (strategyAddress, signer) => {
    try {
      const strategyContract = new ethers.Contract(strategyAddress, strategyABI, signer);
      
      const tx = await strategyContract.emergencyExit();
      await tx.wait();
      
      return {
        success: true,
        message: "Retrait d'urgence effectué avec succès"
      };
    } catch (error) {
      console.error("Erreur lors du retrait d'urgence:", error);
      return {
        success: false,
        message: error.message || "Erreur lors du retrait d'urgence"
      };
    }
  },
  
  /**
   * Charge les données d'une stratégie
   */
  getStrategyData: async (strategyAddress, tokenAddress, provider) => {
    try {
      const strategyContract = new ethers.Contract(strategyAddress, strategyABI, provider);
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      
      // Charger uniquement les données disponibles
      const [depositedAmount, stakedCakeAmount, totalRewardsHarvested, isActive, decimals, symbol] = await Promise.all([
        strategyContract.depositedAmount().catch(() => BigInt(0)),
        strategyContract.stakedCakeAmount().catch(() => BigInt(0)),
        strategyContract.totalRewardsHarvested().catch(() => BigInt(0)),
        strategyContract.isActive().catch(() => true),
        tokenContract.decimals(),
        tokenContract.symbol()
      ]);
      
      return {
        dailyYield: 0, // Pas disponible
        currentValue: ethers.utils.formatUnits(depositedAmount, decimals),
        remainingLockTime: 0, // Pas disponible
        isActive,
        statusMessage: isActive ? "Active" : "Inactive",
        decimals,
        symbol,
        depositedAmount: ethers.utils.formatUnits(depositedAmount, decimals),
        stakedCakeAmount: ethers.utils.formatUnits(stakedCakeAmount, decimals),
        totalRewardsHarvested: ethers.utils.formatUnits(totalRewardsHarvested, decimals)
      };
    } catch (error) {
      console.error("Erreur lors du chargement des données de la stratégie:", error);
      return null;
    }
  },
  
  /**
   * Vérifie si un utilisateur est le propriétaire du contrat principal
   */
  isContractOwner: async (userAddress, provider) => {
    try {
      const contract = new ethers.Contract(
        ADDRESSES.CRYPTO_VAULT_STAKING,
        cryptoVaultStakingABI,
        provider
      );
      
      const owner = await contract.owner();
      return owner.toLowerCase() === userAddress.toLowerCase();
    } catch (error) {
      console.error("Erreur lors de la vérification du propriétaire:", error);
      return false;
    }
  }
};

export default strategyService;