import dotenv from "dotenv";
import hre from "hardhat";
dotenv.config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Utiliser CryptoVaultStakingV3 au lieu de Staking
  const CryptoVaultStakingV3 = await hre.ethers.getContractFactory("CryptoVaultStakingV3");
  
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.FEE_COLLECTOR_ADDRESS) {
    throw new Error("FEE_COLLECTOR_ADDRESS not set in environment variables");
  }

  // ✅ AJOUTÉ - Adresse de votre contrat NFT
  if (!process.env.NFT_CONTRACT_ADDRESS) {
    throw new Error("NFT_CONTRACT_ADDRESS not set in environment variables");
  }

  console.log("FEE_COLLECTOR_ADDRESS:", process.env.FEE_COLLECTOR_ADDRESS);
  console.log("NFT_CONTRACT_ADDRESS:", process.env.NFT_CONTRACT_ADDRESS);
  
  // ✅ MODIFIÉ - Passer les 2 paramètres au constructor
  const staking = await CryptoVaultStakingV3.deploy(
    process.env.FEE_COLLECTOR_ADDRESS,
    process.env.NFT_CONTRACT_ADDRESS  // ✅ AJOUTÉ
  );
  
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("CryptoVaultStakingV3 contract deployed to:", stakingAddress);
  
  // Vérifier le contrat sur l'explorateur
  if (process.env.NETWORK !== "hardhat" && process.env.NETWORK !== "localhost") {
    console.log("Waiting for block confirmations...");
    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [
          process.env.FEE_COLLECTOR_ADDRESS,
          process.env.NFT_CONTRACT_ADDRESS  // ✅ AJOUTÉ
        ],
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