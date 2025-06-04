import { ethers, run } from "hardhat";

async function main() {
  // Vérifier la présence de variables d'environnement
  if (!process.env.NETWORK) {
    throw new Error("NETWORK environment variable is not set");
  }

  // Récupérer le compte du déployeur
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Vérifier la présence de l'adresse du collecteur de frais
  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS;
  if (!feeCollectorAddress) {
    throw new Error("FEE_COLLECTOR_ADDRESS not set in environment variables");
  }

  console.log("Deploying to network:", process.env.NETWORK);
  console.log("Fee Collector Address:", feeCollectorAddress);

  // Déployer le contrat
  const CryptoVaultStaking = await ethers.getContractFactory("CryptoVaultStaking");
  const staking = await CryptoVaultStaking.deploy(feeCollectorAddress);
  
  // Attendre le déploiement
  await staking.waitForDeployment();
  
  // Récupérer l'adresse du contrat
  const stakingAddress = await staking.getAddress();
  console.log("CryptoVaultStaking contract deployed to:", stakingAddress);

  // Vérification du contrat (uniquement sur les réseaux autres que localhost/hardhat)
  const network = process.env.NETWORK;
  if (network && network !== "hardhat" && network !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Attendre quelques blocs pour la propagation
    await new Promise(resolve => setTimeout(resolve, 45000));

    try {
      console.log("Verifying contract on explorer...");
      await run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [feeCollectorAddress],
      });
      console.log("Contract verification successful");
    } catch (error) {
      console.error("Contract verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });