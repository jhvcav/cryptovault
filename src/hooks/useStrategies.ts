//src/hooks/useStrategies.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';

// Adresses des contrats et wallets
const ADDRESSES = {
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STAKING_CONTRACT: "0x719fd9F511DDc561D03801161742D84ECb9445e9",
  MANAGEMENT_FEE_WALLET: "0x7558cBa3b60F11FBbEcc9CcAB508afA65d88B3d2",
  RESERVE_WALLET: "0x3837944Bb983886ED6e8d26b5e5F54a27A2BF214",
  OWNER_WALLET: "0x1FF70C1DFc33F5DDdD1AD2b525a07b172182d8eF",
  WALLET_OWNER_RECOMPENSE: "0x6Cf9fA1738C0c2AE386EF8a75025B53DEa95407a" // Wallet Owner Récompense
};

// ABI ERC20
const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)"
];

// ABI pour le staking contract
const stakingABI = [
  "function adminWithdraw(address _token, uint256 _amount) external",
  "function adminWithdrawAll(address _token) external"
];

export interface StakingBalances {
  [key: string]: number;
}

export const useStrategies = () => {
  const { provider, signer, stakingContract } = useContracts();
  
  const [stakingBalances, setStakingBalances] = useState<StakingBalances>({ USDC: 0, USDT: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fonction pour créer un wallet depuis une clé privée
  const createManagementWallet = () => {
    const privateKey = import.meta.env.VITE_APP_MANAGEMENT_PRIVATE_KEY;
    if (!privateKey || !provider) {
      throw new Error('Clé privée du wallet de gestion non configurée');
    }
    return new ethers.Wallet(privateKey, provider);
  };
  
  // Charger les données des balances
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
      console.log("Chargement des balances dans le contrat principal...");
      
      // Vérifier l'adresse du contrat de staking
      const stakingAddress = await stakingContract.getAddress();
      console.log("Adresse du contrat de staking:", stakingAddress);
      
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
      
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
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
  
  // Fonction pour transférer vers la stratégie (du pool vers Owner Wallet)
  const transferToStrategy = async (amount: string) => {
    if (!signer || !stakingContract || !amount || Number(amount) <= 0) {
      return { success: false, message: "Paramètres invalides ou montant incorrect" };
    }
    
    try {
      const tokenAddress = ADDRESSES.USDC_TOKEN;
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      console.log(`Transfert de ${amount} USDC du pool vers Owner Wallet...`);
      
      // Utiliser adminWithdraw pour transférer vers le Owner Wallet
      const tx = await stakingContract.adminWithdraw(tokenAddress, amountInWei);
      await tx.wait();
      
      console.log("Transfert effectué, hash de transaction:", tx.hash);
      
      // Rafraîchir les données
      await loadStrategiesData();
      
      return { 
        success: true, 
        message: `${amount} USDC transférés avec succès vers le Owner Wallet` 
      };
    } catch (err) {
      console.error('Erreur lors du transfert vers stratégie:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
      };
    }
  };
  
  // Fonction pour transférer les frais de stratégie vers la réserve (1%)
  const transferFeesToReserve = async (baseAmount: string) => {
  if (!signer || !stakingContract || !baseAmount || Number(baseAmount) <= 0) {
    return { success: false, message: "Paramètres invalides ou montant incorrect" };
  }
  
  try {
    const tokenAddress = ADDRESSES.USDC_TOKEN;
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
    const decimals = await tokenContract.decimals();
    
    // Calculer 1% du montant de base
    const feeAmount = Number(baseAmount) * 0.01;
    const amountInWei = ethers.parseUnits(feeAmount.toString(), decimals);
    
    console.log(`Transfert de ${feeAmount} USDC (1% de ${baseAmount}) du pool vers Réserve...`);
    
    // 1. D'abord retirer du pool vers votre wallet
    const tx1 = await stakingContract.adminWithdraw(tokenAddress, amountInWei);
    await tx1.wait();
    
    // 2. Ensuite transférer vers la Réserve
    const tx2 = await tokenContract.transfer(ADDRESSES.RESERVE_WALLET, amountInWei);
    await tx2.wait();
    
    console.log("Transfert effectué, hash de transaction final:", tx2.hash);
    
    // Rafraîchir les données
    await loadStrategiesData();
    
    return { 
      success: true, 
      message: `${feeAmount.toFixed(2)} USDC (1% de ${baseAmount}) transférés avec succès vers la Réserve` 
    };
  } catch (err) {
    console.error('Erreur lors du transfert des frais vers la réserve:', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
    };
  }
};
  
  // Fonction pour transférer les frais de stratégie vers le owner (9%)
  const transferFeesToOwner = async (baseAmount: string) => {
  if (!signer || !stakingContract || !baseAmount || Number(baseAmount) <= 0) {
    return { success: false, message: "Paramètres invalides ou montant incorrect" };
  }
  
  try {
    const tokenAddress = ADDRESSES.USDC_TOKEN;
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
    const decimals = await tokenContract.decimals();
    
    // Calculer 9% du montant de base
    const feeAmount = Number(baseAmount) * 0.09;
    const amountInWei = ethers.parseUnits(feeAmount.toString(), decimals);
    
    console.log(`Transfert de ${feeAmount} USDC (9% de ${baseAmount}) du pool vers Owner Récompense...`);
    
    // Créer un wallet temporaire pour effectuer le transfert vers WALLET_OWNER_RECOMPENSE
    const ownerAddress = await signer.getAddress();
    
    // D'abord retirer du pool vers le wallet actuel
    const tx1 = await stakingContract.adminWithdraw(tokenAddress, amountInWei);
    await tx1.wait();
    
    // Ensuite transférer vers WALLET_OWNER_RECOMPENSE
    const tx2 = await tokenContract.transfer(ADDRESSES.WALLET_OWNER_RECOMPENSE, amountInWei);
    await tx2.wait();
    
    console.log("Transfert effectué, hash de transaction:", tx2.hash);
    
    // Rafraîchir les données
    await loadStrategiesData();
    
    return { 
      success: true, 
      message: `${feeAmount.toFixed(2)} USDC (9% de ${baseAmount}) transférés avec succès vers l'Owner Récompense` 
    };
  } catch (err) {
    console.error('Erreur lors du transfert des frais vers l\'owner récompense:', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
    };
  }
};
  
  // Fonction pour transférer les frais de dépôt vers la réserve (0.5%)
  const transferDepositFeesToReserve = async (baseAmount: string) => {
    if (!baseAmount || Number(baseAmount) <= 0) {
      return { success: false, message: "Paramètres invalides ou montant incorrect" };
    }
    
    try {
      // Créer le wallet de gestion à partir de la clé privée
      const managementWallet = createManagementWallet();
      
      const tokenAddress = ADDRESSES.USDC_TOKEN;
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, managementWallet);
      const decimals = await tokenContract.decimals();
      
      // Calculer 0.5% du montant de base
      const feeAmount = Number(baseAmount) * 0.005;
      const amountInWei = ethers.parseUnits(feeAmount.toString(), decimals);
      
      console.log(`Transfert de ${feeAmount} USDC (0.5% de ${baseAmount}) du wallet de gestion vers Réserve...`);
      
      // Transférer directement vers la Réserve
      const tx = await tokenContract.transfer(ADDRESSES.RESERVE_WALLET, amountInWei);
      await tx.wait();
      
      console.log("Transfert effectué, hash de transaction:", tx.hash);
      
      // Rafraîchir les données
      await loadStrategiesData();
      
      return { 
        success: true, 
        message: `${feeAmount.toFixed(2)} USDC (0.5% de ${baseAmount}) transférés avec succès vers la Réserve` 
      };
    } catch (err) {
      console.error('Erreur lors du transfert des frais de dépôt vers la réserve:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
      };
    }
  };
  
  // Fonction pour transférer les frais de dépôt vers l'owner (1.5%)
  const transferDepositFeesToOwner = async (baseAmount: string) => {
  if (!baseAmount || Number(baseAmount) <= 0) {
    return { success: false, message: "Paramètres invalides ou montant incorrect" };
  }
  
  try {
    // Créer le wallet de gestion à partir de la clé privée
    const managementWallet = createManagementWallet();
    
    const tokenAddress = ADDRESSES.USDC_TOKEN;
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, managementWallet);
    const decimals = await tokenContract.decimals();
    
    // Calculer 1.5% du montant de base
    const feeAmount = Number(baseAmount) * 0.015;
    const amountInWei = ethers.parseUnits(feeAmount.toString(), decimals);
    
    console.log(`Transfert de ${feeAmount} USDC (1.5% de ${baseAmount}) du wallet de gestion vers Owner Récompense...`);
    
    // Transférer directement vers WALLET_OWNER_RECOMPENSE au lieu de OWNER_WALLET
    const tx = await tokenContract.transfer(ADDRESSES.WALLET_OWNER_RECOMPENSE, amountInWei);
    await tx.wait();
    
    console.log("Transfert effectué, hash de transaction:", tx.hash);
    
    // Rafraîchir les données
    await loadStrategiesData();
    
    return { 
      success: true, 
      message: `${feeAmount.toFixed(2)} USDC (1.5% de ${baseAmount}) transférés avec succès vers l'Owner Récompense` 
    };
  } catch (err) {
    console.error('Erreur lors du transfert des frais de dépôt vers l\'owner récompense:', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Transaction échouée pour une raison inconnue' 
    };
  }
};
  
  return {
    stakingBalances,
    loading,
    error,
    loadStrategiesData,
    transferToStrategy,
    transferFeesToReserve,
    transferFeesToOwner,
    transferDepositFeesToReserve,
    transferDepositFeesToOwner
  };
};

export default useStrategies;