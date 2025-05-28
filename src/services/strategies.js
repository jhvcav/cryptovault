// services/strategies.js
import { ethers } from "ethers";
import { connectToContracts, ADDRESSES } from "./contracts";

// Fonction pour déployer des fonds vers une stratégie
export async function deployToStrategy(tokenAddress, strategyAddress, amount) {
  // Connexion aux contrats
  const { cryptoVaultStaking, signer } = await connectToContracts();
  
  // 1. Retirer les fonds du contrat principal
  const tx1 = await cryptoVaultStaking.adminWithdraw(tokenAddress, amount);
  await tx1.wait();
  
  // 2. Récupérer le contrat du token
  const tokenABI = ["function approve(address spender, uint256 amount) returns (bool)"];
  const token = new ethers.Contract(tokenAddress, tokenABI, signer);
  
  // 3. Approuver la stratégie
  const tx2 = await token.approve(strategyAddress, amount);
  await tx2.wait();
  
  // 4. Créer une instance du contrat stratégie
  const strategyABI = ["function deposit(uint256 amount, uint256 lockDuration) external"];
  const strategy = new ethers.Contract(strategyAddress, strategyABI, signer);
  
  // 5. Déposer dans la stratégie (sans verrouillage)
  const tx3 = await strategy.deposit(amount, 0);
  await tx3.wait();
  
  return { success: true };
}

// Fonction pour récupérer des fonds depuis une stratégie
export async function retrieveFromStrategy(strategyAddress, amount) {
  // Connexion aux contrats
  const { signer } = await connectToContracts();
  
  // Créer une instance du contrat stratégie
  const strategyABI = ["function withdraw(uint256 amount) external"];
  const strategy = new ethers.Contract(strategyAddress, strategyABI, signer);
  
  // Retirer de la stratégie
  const tx = await strategy.withdraw(amount);
  await tx.wait();
  
  return { success: true };
}

// Fonction pour récupérer les rendements
export async function harvestRewards(strategyAddress) {
  // Connexion aux contrats
  const { signer } = await connectToContracts();
  
  // Créer une instance du contrat stratégie
  const strategyABI = ["function harvest() external"];
  const strategy = new ethers.Contract(strategyAddress, strategyABI, signer);
  
  // Récolter les récompenses
  const tx = await strategy.harvest();
  await tx.wait();
  
  return { success: true };
}