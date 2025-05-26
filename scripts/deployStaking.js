import dotenv from "dotenv";
import hre from "hardhat";
dotenv.config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Utiliser CryptoVaultStaking au lieu de Staking
  const CryptoVaultStaking = await hre.ethers.getContractFactory("CryptoVaultStaking");
  
  // Vérifier que la variable d'environnement est définie
  if (!process.env.FEE_COLLECTOR_ADDRESS) {
    throw new Error("FEE_COLLECTOR_ADDRESS not set in environment variables");
  }

  console.log("FEE_COLLECTOR_ADDRESS:", process.env.FEE_COLLECTOR_ADDRESS);
  
  const staking = await CryptoVaultStaking.deploy(process.env.FEE_COLLECTOR_ADDRESS);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("CryptoVaultStaking contract deployed to:", stakingAddress);
  
  // Vérifier le contrat sur l'explorateur
  if (process.env.NETWORK !== "hardhat" && process.env.NETWORK !== "localhost") {
    console.log("Waiting for block confirmations...");
    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [process.env.FEE_COLLECTOR_ADDRESS],
      });
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });