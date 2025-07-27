import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

// Adresses des contrats
const ADDRESSES = {
  CAKE_STRATEGY_USDC: "0x3A9f7FA2dCFFBfAC8732E13AA0D4ba56D7708836",
  CAKE_STRATEGY_USDT: "0xEb680C41D5bb5eD5A241aF0Cb2285E29AE00b231",
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955"
};

// ABI pour les stratégies - Utiliser uniquement les méthodes que nous savons qui existent
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

// ABI ERC20
const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)" // Ajout de la fonction transfer
];

export interface Strategy {
  id: number;
  address: string;
  name: string;
  token: string;
  tokenSymbol: string;
  dailyYield: number;
  currentValue: string;
  remainingLockTime: number;
  isActive: boolean;
  statusMessage: string;
  decimals: number;
  depositedAmount: string;
  stakedCakeAmount: string;
  totalRewardsHarvested: string;
}

export interface StakingBalances {
  [key: string]: number;
}

export const useStrategies = () => {
  const { provider, signer, stakingContract } = useContracts();
  
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [stakingBalances, setStakingBalances] = useState<StakingBalances>({ USDC: 0, USDT: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les données des stratégies
  const loadStrategiesData = async () => {
    console.log("Début de loadStrategiesData");
    console.log("Provider:", provider);
    console.log("Signer:", signer);
    console.log("StakingContract:", stakingContract);
    
    if (!provider || !signer || !stakingContract) {
      console.log("Conditions préalables non remplies: provider, signer ou stakingContract manquant");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Chargement des données des stratégies...");
      
      // Récupérer l'adresse du signeur
      const signerAddress = await signer.getAddress();
      console.log("Adresse du signeur:", signerAddress);
      
      // Vérifier l'adresse du contrat de staking
      const stakingAddress = await stakingContract.getAddress();
      console.log("Adresse du contrat de staking:", stakingAddress);

      // Configuration des stratégies
      const strategiesConfig = [
        { id: 1, address: ADDRESSES.CAKE_STRATEGY_USDC, token: ADDRESSES.USDC_TOKEN, name: 'CAKE Staking - USDC' },
        { id: 2, address: ADDRESSES.CAKE_STRATEGY_USDT, token: ADDRESSES.USDT_TOKEN, name: 'CAKE Staking - USDT' }
      ];
      
      // Récupérer les données des stratégies
      const strategiesPromises = strategiesConfig.map(async (config) => {
        try {
          console.log(`Chargement des données pour la stratégie: ${config.name}`);
          
          // Créer les contrats avec Signer
          const strategy = new ethers.Contract(config.address, strategyABI, signer);
          const token = new ethers.Contract(config.token, erc20ABI, provider);
          
          // Récupérer uniquement les données que nous savons qui existent
          const [
            depositedAmount,
            stakedCakeAmount,
            totalRewardsHarvested,
            isActive,
            decimals,
            symbol
          ] = await Promise.all([
            strategy.depositedAmount().catch(() => BigInt(0)),
            strategy.stakedCakeAmount().catch(() => BigInt(0)),
            strategy.totalRewardsHarvested().catch(() => BigInt(0)),
            strategy.isActive().catch(() => true),
            token.decimals().catch(() => 18),
            token.symbol().catch(() => config.token === ADDRESSES.USDC_TOKEN ? "USDC" : "USDT")
          ]);
          
          return {
            ...config,
            dailyYield: 0, // Valeur par défaut car getDailyYield n'est pas disponible
            currentValue: ethers.formatUnits(depositedAmount, decimals),
            remainingLockTime: 0, // Valeur par défaut car getRemainingLockTime n'est pas disponible
            isActive,
            statusMessage: isActive ? "Active" : "Inactive",
            tokenSymbol: symbol,
            decimals,
            depositedAmount: ethers.formatUnits(depositedAmount, decimals),
            stakedCakeAmount: ethers.formatUnits(stakedCakeAmount, decimals),
            totalRewardsHarvested: ethers.formatUnits(totalRewardsHarvested, decimals)
          };
        } catch (strategyError) {
          console.error(`Erreur globale pour la stratégie ${config.name}:`, strategyError);
          return {
            ...config,
            dailyYield: 0,
            currentValue: '0',
            remainingLockTime: 0,
            isActive: false,
            statusMessage: "Erreur de chargement",
            tokenSymbol: config.token === ADDRESSES.USDC_TOKEN ? "USDC" : "USDT",
            decimals: 18,
            depositedAmount: '0',
            stakedCakeAmount: '0',
            totalRewardsHarvested: '0'
          };
        }
      });
      
      const strategiesData = await Promise.all(strategiesPromises);
      setStrategies(strategiesData);
      
      // Charger les balances des tokens
      try {
        console.log("Chargement des balances dans le contrat principal...");
        
        const usdcContract = new ethers.Contract(ADDRESSES.USDC_TOKEN, erc20ABI, provider);
        const usdtContract = new ethers.Contract(ADDRESSES.USDT_TOKEN, erc20ABI, provider);
        
        const [usdcBalance, usdtBalance, usdcDecimals, usdtDecimals] = await Promise.all([
          usdcContract.balanceOf(stakingAddress),
          usdtContract.balanceOf(stakingAddress),
          usdcContract.decimals(),
          usdtContract.decimals()
        ]);
        
        console.log("Balance USDC brute:", usdcBalance.toString());
        console.log("Balance USDT brute:", usdtBalance.toString());
        console.log("Décimales USDC:", usdcDecimals);
        console.log("Décimales USDT:", usdtDecimals);
        
        const usdcBalanceFormatted = Number(ethers.formatUnits(usdcBalance, usdcDecimals));
        const usdtBalanceFormatted = Number(ethers.formatUnits(usdtBalance, usdtDecimals));
        
        console.log("Balance USDC formatée:", usdcBalanceFormatted);
        console.log("Balance USDT formatée:", usdtBalanceFormatted);
        
        setStakingBalances({
          USDC: usdcBalanceFormatted,
          USDT: usdtBalanceFormatted
        });
      } catch (balanceError) {
        console.error("Erreur lors de la récupération des balances:", balanceError);
      }
      
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des données des stratégies:", err);
      setError("Erreur lors du chargement des données: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les données seulement quand les contrats sont disponibles
  useEffect(() => {
    if (provider && signer && stakingContract) {
      loadStrategiesData();
      
      // Interval de rechargement plus raisonnable (toutes les 30 secondes)
      const interval = setInterval(loadStrategiesData, 30000);
      return () => clearInterval(interval);
    }
  }, [provider, signer, stakingContract]);
  
  // Fonction pour déployer des fonds vers une stratégie depuis le wallet du propriétaire
  const deployToStrategy = async (tokenSymbol: string, amount: string) => {
    if (!signer || !stakingContract || !amount || Number(amount) <= 0) {
      return { success: false, message: "Paramètres invalides ou montant incorrect" };
    }
    
    try {
      // Déterminer quelle stratégie utiliser
      const strategyAddress = tokenSymbol === 'USDC' ? ADDRESSES.CAKE_STRATEGY_USDC : ADDRESSES.CAKE_STRATEGY_USDT;
      const tokenAddress = tokenSymbol === 'USDC' ? ADDRESSES.USDC_TOKEN : ADDRESSES.USDT_TOKEN;
      
      console.log(`Déploiement vers ${tokenSymbol}, adresse stratégie: ${strategyAddress}, adresse token: ${tokenAddress}`);
      
      // 1. Connexion aux contrats
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const strategyContract = new ethers.Contract(strategyAddress, strategyABI, signer);
      
      // 2. Obtenir les décimales du token
      const decimals = await tokenContract.decimals();
      
      // 3. Convertir le montant en wei
      const amountInWei = ethers.parseUnits(amount, decimals);
      console.log(`Montant à déployer: ${amount} ${tokenSymbol} (${amountInWei.toString()} wei)`);
      
      // 4. Vérifier le solde du wallet du propriétaire
      const ownerAddress = await signer.getAddress();
      const ownerBalance = await tokenContract.balanceOf(ownerAddress);
      console.log(`Solde du wallet propriétaire: ${ethers.formatUnits(ownerBalance, decimals)} ${tokenSymbol}`);
      
      if (ownerBalance < amountInWei) {
        return { 
          success: false, 
          message: `Solde insuffisant dans votre wallet pour déployer ${amount} ${tokenSymbol}` 
        };
      }
      
      // 5. Transférer d'abord les tokens vers le contrat de stratégie
      console.log(`Transfert de ${amount} ${tokenSymbol} vers la stratégie...`);
      const tx1 = await tokenContract.transfer(strategyAddress, amountInWei);
      await tx1.wait();
      console.log("Transfert effectué, hash de transaction:", tx1.hash);
      
      // 6. Maintenant appeler deposit() sur la stratégie
      console.log(`Appel à deposit sur la stratégie...`);
      const tx2 = await strategyContract.deposit(amountInWei, 0); // 0 = pas de verrouillage
      await tx2.wait();
      console.log("Dépôt effectué, hash de transaction:", tx2.hash);
      
      // 7. Rafraîchir les données
      await loadStrategiesData();
      
      return { 
        success: true, 
        message: `${amount} ${tokenSymbol} déployés avec succès dans la stratégie` 
      };
    } catch (err) {
      console.error('Erreur lors du déploiement des fonds:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
      };
    }
  };
  
  // Fonction pour retirer des fonds d'une stratégie
  const withdrawFromStrategy = async (strategyId: number) => {
    if (!signer || !stakingContract) {
      return { success: false, message: "Connexion non disponible" };
    }
    
    try {
      const strategy = strategies.find(s => s.id === strategyId);
      if (!strategy) {
        return { success: false, message: "Stratégie non trouvée" };
      }
      
      const strategyContract = new ethers.Contract(strategy.address, strategyABI, signer);
      
      // Récupérer le montant à retirer (depositedAmount)
      const depositedAmount = await strategyContract.depositedAmount();
      if (depositedAmount == 0) {
        return { success: false, message: "Aucun fonds à retirer" };
      }
      
      console.log(`Retrait de la stratégie ${strategy.name}...`);
      const tx = await strategyContract.withdraw(depositedAmount);
      await tx.wait();
      console.log("Retrait effectué, hash de transaction:", tx.hash);
      
      // Rafraîchir les données
      await loadStrategiesData();
      
      return { 
        success: true, 
        message: `Fonds retirés avec succès de la stratégie ${strategy.name}` 
      };
    } catch (err) {
      console.error('Erreur lors du retrait des fonds:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
      };
    }
  };
  
  // Fonction pour récolter les récompenses
  const harvestRewards = async (strategyId: number) => {
    if (!signer || !stakingContract) {
      return { success: false, message: "Connexion non disponible" };
    }
    
    try {
      const strategy = strategies.find(s => s.id === strategyId);
      if (!strategy) {
        return { success: false, message: "Stratégie non trouvée" };
      }
      
      const strategyContract = new ethers.Contract(strategy.address, strategyABI, signer);
      
      console.log(`Récolte des récompenses de la stratégie ${strategy.name}...`);
      const tx = await strategyContract.harvest();
      await tx.wait();
      console.log("Récolte effectuée, hash de transaction:", tx.hash);
      
      // Rafraîchir les données
      await loadStrategiesData();
      
      return { 
        success: true, 
        message: `Récompenses récoltées avec succès de la stratégie ${strategy.name}` 
      };
    } catch (err) {
      console.error('Erreur lors de la récolte des récompenses:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
      };
    }
  };
  
  // Fonction pour effectuer un retrait d'urgence
  const emergencyExit = async (strategyId: number) => {
    if (!signer || !stakingContract) {
      return { success: false, message: "Connexion non disponible" };
    }
    
    try {
      const strategy = strategies.find(s => s.id === strategyId);
      if (!strategy) {
        return { success: false, message: "Stratégie non trouvée" };
      }
      
      const strategyContract = new ethers.Contract(strategy.address, strategyABI, signer);
      
      console.log(`Retrait d'urgence de la stratégie ${strategy.name}...`);
      const tx = await strategyContract.emergencyExit();
      await tx.wait();
      console.log("Retrait d'urgence effectué, hash de transaction:", tx.hash);
      
      // Rafraîchir les données
      await loadStrategiesData();
      
      return { 
        success: true, 
        message: `Retrait d'urgence effectué avec succès de la stratégie ${strategy.name}` 
      };
    } catch (err) {
      console.error('Erreur lors du retrait d\'urgence:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
      };
    }
  };
  
  // Formater le temps restant en format lisible
  const formatRemainingTime = (seconds: number): string => {
    if (seconds === 0) return 'Pas de verrouillage';
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}j ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  return {
    strategies,
    stakingBalances,
    loading,
    error,
    loadStrategiesData,
    deployToStrategy,
    withdrawFromStrategy,
    harvestRewards,
    emergencyExit,
    formatRemainingTime
  };
};

export default useStrategies;