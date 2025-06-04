const { execSync } = require("child_process");

// Adresses des contrats déployés - À remplir après le déploiement
const DEPLOYED = {
  CAKE_USDC_STRATEGY: "",    // Adresse de la stratégie CAKE-USDC
  CAKE_USDT_STRATEGY: "",    // Adresse de la stratégie CAKE-USDT
};

// Adresses sur BSC Mainnet
const ADDRESSES = {
  PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // Router PancakeSwap v2
  CAKE_POOL: "0x45c54210128a065de780C4B0Df3d16664f7f859e",       // CAKE Syrup Pool
  CAKE_TOKEN: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",     // Token CAKE
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",     // Token USDC sur BSC
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",     // Token USDT sur BSC (BSC-USD)
};

async function main() {
  // Vérifier que toutes les adresses sont définies
  const missingAddresses = Object.entries(DEPLOYED)
    .filter(([_, value]) => !value || value === "")
    .map(([key]) => key);
  
  if (missingAddresses.length > 0) {
    console.error("Veuillez définir toutes les adresses des contrats déployés:", missingAddresses.join(", "));
    return;
  }
  
  console.log("Vérification des contrats sur BSC...");
  
  try {
    // Vérifier la stratégie CAKE-USDC
    console.log("Vérification de la stratégie CAKE-USDC...");
    execSync(`npx hardhat verify --network bsc ${DEPLOYED.CAKE_USDC_STRATEGY} ${ADDRESSES.PANCAKE_ROUTER} ${ADDRESSES.CAKE_POOL} ${ADDRESSES.CAKE_TOKEN} ${ADDRESSES.USDC_TOKEN}`, { stdio: 'inherit' });
    
    // Vérifier la stratégie CAKE-USDT
    console.log("Vérification de la stratégie CAKE-USDT...");
    execSync(`npx hardhat verify --network bsc ${DEPLOYED.CAKE_USDT_STRATEGY} ${ADDRESSES.PANCAKE_ROUTER} ${ADDRESSES.CAKE_POOL} ${ADDRESSES.CAKE_TOKEN} ${ADDRESSES.USDT_TOKEN}`, { stdio: 'inherit' });
    
    console.log("Vérification terminée avec succès!");
  } catch (error) {
    console.error("Erreur lors de la vérification:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });