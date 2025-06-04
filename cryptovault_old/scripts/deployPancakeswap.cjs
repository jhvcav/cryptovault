const hre = require("hardhat");
require("dotenv").config();

// Adresses sur BSC Mainnet
const ADDRESSES = {
  PANCAKE_ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  CAKE_POOL: "0x45c54210128a065de780C4B0Df3d16664f7f859e",
  CAKE_TOKEN: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
  USDC_TOKEN: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Déployer la stratégie pour USDC
  console.log("Déploiement de la stratégie CAKE-USDC...");
  const CakeStakingStrategyUSDC = await hre.ethers.getContractFactory("CakeStakingStrategy");
  const cakeUsdcStrategy = await CakeStakingStrategyUSDC.deploy(
    ADDRESSES.PANCAKE_ROUTER,
    ADDRESSES.CAKE_POOL,
    ADDRESSES.CAKE_TOKEN,
    ADDRESSES.USDC_TOKEN
  );
  
  await cakeUsdcStrategy.waitForDeployment();
  const usdcStrategyAddress = await cakeUsdcStrategy.getAddress();
  console.log("Stratégie CAKE-USDC déployée à l'adresse:", usdcStrategyAddress);
  
  // Déployer la stratégie pour USDT
  console.log("Déploiement de la stratégie CAKE-USDT...");
  const CakeStakingStrategyUSDT = await hre.ethers.getContractFactory("CakeStakingStrategy");
  const cakeUsdtStrategy = await CakeStakingStrategyUSDT.deploy(
    ADDRESSES.PANCAKE_ROUTER,
    ADDRESSES.CAKE_POOL,
    ADDRESSES.CAKE_TOKEN,
    ADDRESSES.USDT_TOKEN
  );
  
  await cakeUsdtStrategy.waitForDeployment();
  const usdtStrategyAddress = await cakeUsdtStrategy.getAddress();
  console.log("Stratégie CAKE-USDT déployée à l'adresse:", usdtStrategyAddress);
  
  // Vérifier les contrats sur l'explorateur
  if (process.env.NETWORK !== "hardhat" && process.env.NETWORK !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Vérifier la stratégie USDC
    console.log("Verifying CAKE-USDC strategy on explorer...");
    try {
      await hre.run("verify:verify", {
        address: usdcStrategyAddress,
        constructorArguments: [
          ADDRESSES.PANCAKE_ROUTER,
          ADDRESSES.CAKE_POOL,
          ADDRESSES.CAKE_TOKEN,
          ADDRESSES.USDC_TOKEN
        ],
      });
    } catch (error) {
      console.error("Error verifying CAKE-USDC strategy:", error);
    }

    // Vérifier la stratégie USDT
    console.log("Verifying CAKE-USDT strategy on explorer...");
    try {
      await hre.run("verify:verify", {
        address: usdtStrategyAddress,
        constructorArguments: [
          ADDRESSES.PANCAKE_ROUTER,
          ADDRESSES.CAKE_POOL,
          ADDRESSES.CAKE_TOKEN,
          ADDRESSES.USDT_TOKEN
        ],
      });
    } catch (error) {
      console.error("Error verifying CAKE-USDT strategy:", error);
    }
  }
  
  console.log("====== DÉPLOIEMENT TERMINÉ ======");
  console.log("Stratégie CAKE-USDC:", usdcStrategyAddress);
  console.log("Stratégie CAKE-USDT:", usdtStrategyAddress);
  console.log("================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });