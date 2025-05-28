// services/contracts.js
import { ethers } from "ethers";

// ABI des contrats (versions simplifiées)
const cryptoVaultStakingABI = [
  // ABI du contrat CryptoVaultStaking
  "function owner() view returns (address)",
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function getReward() external",
  "function balanceOf(address account) view returns (uint256)"
]; // Votre ABI existant
const cakeStakingStrategyABI = [
  // ABI de la stratégie de staking CAKE
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function getDailyYield() external view returns (uint256)",
  "function getCurrentValue() external view returns (uint256)",
  "function getRemainingLockTime() external view returns (uint256)",
  "function getPoolStatus() external view returns (bool, string)"
]; // ABI de la stratégie de staking CAKE
const erc20ABI = [
  // ABI ERC20 standard
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)"
]; // ABI ERC20 standard
const newCryptoVaultStakingABI = [
  // ABI du contrat CryptoVaultStaking (nouvelle version)
  "function adminWithdraw(address _token, uint256 _amount) external",
  "function adminWithdrawAll(address _token) external",
  "function owner() view returns (address)"
]; // Nouvel ABI

// Adresses des contrats
export const ADDRESSES = {
  CRYPTO_VAULT_STAKING: "0x719fd9F511DDc561D03801161742D84ECb9445e9", // Votre contrat déployé
  CAKE_STRATEGY_USDC: "0x3A9f7FA2dCFFBfAC8732E13AA0D4ba56D7708836",   // Stratégie USDC déployée
  CAKE_STRATEGY_USDT: "0xEb680C41D5bb5eD5A241aF0Cb2285E29AE00b231",   // Stratégie USDT déployée
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955"
};

// Fonction pour se connecter aux contrats
export async function connectToContracts() {
  // Vérifier que MetaMask est installé
  if (!window.ethereum) {
    throw new Error("MetaMask non détecté");
  }
  
  // Se connecter à MetaMask
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  // Créer le provider et le signer
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  // Créer les instances de contrats
  const cryptoVaultStaking = new ethers.Contract(
    ADDRESSES.CRYPTO_VAULT_STAKING,
    cryptoVaultStakingABI,
    signer
  );
  
  const cakeStrategyUsdc = new ethers.Contract(
    ADDRESSES.CAKE_STRATEGY_USDC,
    cakeStakingStrategyABI,
    signer
  );
  
  const cakeStrategyUsdt = new ethers.Contract(
    ADDRESSES.CAKE_STRATEGY_USDT,
    cakeStakingStrategyABI,
    signer
  );
  
  // Vérifier que l'utilisateur est le propriétaire
  const owner = await cryptoVaultStaking.owner();
  const currentAddress = await signer.getAddress();
  const isOwner = owner.toLowerCase() === currentAddress.toLowerCase();
  
  return {
    provider,
    signer,
    cryptoVaultStaking,
    cakeStrategyUsdc,
    cakeStrategyUsdt,
    isOwner
  };
}

export default contracts;