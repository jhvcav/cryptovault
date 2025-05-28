// services/liquidity.js
import { ethers } from "ethers";
import { connectToContracts, ADDRESSES } from "./contracts";

// Fonction pour calculer les réserves nécessaires
export async function calculateRequiredReserves() {
  const { cryptoVaultStaking } = await connectToContracts();
  
  // Récupérer tous les stakes actifs
  // Note: Cette fonction dépend de la structure exacte de votre contrat
  const activeStakes = await getAllActiveStakes(cryptoVaultStaking);
  
  let totalPendingRewards = ethers.BigNumber.from(0);
  
  // Calculer les récompenses en attente pour chaque stake
  for (const stake of activeStakes) {
    const apr = await cryptoVaultStaking.plans(stake.planId).apr;
    const amount = stake.amount;
    const lastRewardTime = stake.lastRewardTime;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - lastRewardTime;
    
    // Calculer la récompense selon la formule de votre contrat
    const reward = amount.mul(apr).mul(timeDiff).div(365 * 24 * 3600).div(10000);
    totalPendingRewards = totalPendingRewards.add(reward);
  }
  
  // Ajouter une marge de sécurité de 10%
  const safetyMargin = totalPendingRewards.div(10);
  const requiredReserves = totalPendingRewards.add(safetyMargin);
  
  return requiredReserves;
}

// Fonction pour vérifier l'adéquation des réserves
export async function checkReserveAdequacy() {
  const { provider } = await connectToContracts();
  
  // Calculer les réserves requises
  const requiredReserves = await calculateRequiredReserves();
  
  // Vérifier les soldes des tokens dans le contrat principal
  const usdcABI = ["function balanceOf(address account) view returns (uint256)"];
  const usdtABI = ["function balanceOf(address account) view returns (uint256)"];
  
  const usdcContract = new ethers.Contract(ADDRESSES.USDC_TOKEN, usdcABI, provider);
  const usdtContract = new ethers.Contract(ADDRESSES.USDT_TOKEN, usdtABI, provider);
  
  const usdcBalance = await usdcContract.balanceOf(ADDRESSES.CRYPTO_VAULT_STAKING);
  const usdtBalance = await usdtContract.balanceOf(ADDRESSES.CRYPTO_VAULT_STAKING);
  
  // Total disponible (supposant que USDC et USDT ont la même valeur)
  const totalAvailable = usdcBalance.add(usdtBalance);
  
  // Calculer le ratio
  const reserveRatio = totalAvailable.mul(100).div(requiredReserves).toNumber() / 100;
  
  return {
    isAdequate: reserveRatio >= 1,
    reserveRatio,
    requiredReserves: ethers.utils.formatUnits(requiredReserves, 6), // Supposant 6 décimales
    availableReserves: ethers.utils.formatUnits(totalAvailable, 6)
  };
}