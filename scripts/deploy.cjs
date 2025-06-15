// scripts/deploy.cjs
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("🚀 Début du déploiement du contrat CryptoVault NFT...\n");

  // Configuration des adresses sur BSC Mainnet
  const USDC_BSC_MAINNET = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  const TREASURY_WALLET = "0xe0B7BCb42aeBB5Be565cc81518a48D780f3c001c";

  // Obtenir le déployeur
  const [deployer] = await ethers.getSigners();
  console.log("📋 Déploiement avec le compte:", deployer.address);
  
  // Vérifier la balance BNB pour les frais de gas (ethers v6)
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance du compte:", ethers.formatEther(balance), "BNB");
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("❌ Balance insuffisante ! Minimum 0.1 BNB requis pour le déploiement");
  }

  // Vérifier qu'on est sur le bon réseau
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Réseau détecté:", network.name, "(Chain ID:", network.chainId.toString(), ")");
  
  if (network.chainId !== 56n) {
    console.log("⚠️  ATTENTION: Vous n'êtes pas sur BSC Mainnet (Chain ID: 56)");
    console.log("   - Pour BSC Mainnet: Chain ID 56");
    console.log("   - Pour BSC Testnet: Chain ID 97");
    console.log("   - Continuer quand même ? (Ctrl+C pour annuler)\n");
    
    // Attendre 10 secondes pour permettre l'annulation
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  console.log("\n📄 Configuration du contrat:");
  console.log("   - Token USDC:", USDC_BSC_MAINNET);
  console.log("   - Treasury Wallet:", TREASURY_WALLET);
  console.log("   - Tiers initiaux: Bronze, Argent, Or, Privilège");

  // Compiler et déployer le contrat
  console.log("\n🔨 Compilation et déploiement...");
  
  const CryptoVaultNFT = await ethers.getContractFactory("CryptoVaultNFT");
  
  // Estimer le gas requis (ethers v6)
  const estimatedGas = await CryptoVaultNFT.getDeployTransaction(USDC_BSC_MAINNET).then(tx => 
    ethers.provider.estimateGas(tx)
  );
  const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
  const estimatedCost = estimatedGas * gasPrice;
  
  console.log("⛽ Estimation des frais:");
  console.log("   - Gas estimé:", estimatedGas.toString());
  console.log("   - Prix du gas:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("   - Coût estimé:", ethers.formatEther(estimatedCost), "BNB");

  // Déployer avec gas limit augmenté pour la sécurité
  const contract = await CryptoVaultNFT.deploy(
    USDC_BSC_MAINNET,
    {
      gasLimit: estimatedGas * 120n / 100n // +20% de marge
    }
  );

  console.log("⏳ Transaction de déploiement envoyée...");
  console.log("   Hash:", contract.deploymentTransaction().hash);

  // Attendre la confirmation (ethers v6)
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ Contrat déployé avec succès !");
  console.log("📍 Adresse du contrat:", contractAddress);
  console.log("🔗 BSCScan:", `https://bscscan.com/address/${contractAddress}`);

  // Vérifier la configuration du contrat
  console.log("\n🔍 Vérification de la configuration...");
  
  try {
    const treasuryInfo = await contract.getTreasuryInfo();
    const tier1Info = await contract.getTierInfo(1);
    const tier4Info = await contract.getTierInfo(4);
    
    console.log("✅ Treasury configuré:");
    console.log("   - Adresse primaire:", treasuryInfo.primaryTreasury);
    console.log("   - Adresse backup:", treasuryInfo.backupTreasury);
    console.log("   - Revenus totaux:", ethers.formatEther(treasuryInfo.totalGenerated), "USDC");
    
    console.log("✅ Tiers NFT configurés:");
    console.log("   - NFT Bronze (Tier 1):", tier1Info.name, "-", ethers.formatEther(tier1Info.price), "USDC");
    console.log("   - NFT Privilège (Tier 4):", tier4Info.name, "-", ethers.formatEther(tier4Info.price), "USDC");
    
    // Vérifier que le treasury est correct
    if (treasuryInfo.primaryTreasury.toLowerCase() === TREASURY_WALLET.toLowerCase()) {
      console.log("✅ Treasury wallet correctement configuré");
    } else {
      console.log("❌ ERREUR: Treasury wallet incorrect !");
      console.log("   Attendu:", TREASURY_WALLET);
      console.log("   Configuré:", treasuryInfo.primaryTreasury);
    }
    
  } catch (error) {
    console.log("❌ Erreur lors de la vérification:", error.message);
  }

  // Sauvegarder les informations de déploiement
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    treasuryWallet: TREASURY_WALLET,
    usdcToken: USDC_BSC_MAINNET,
    deploymentHash: contract.deploymentTransaction().hash,
    timestamp: new Date().toISOString(),
    gasUsed: estimatedGas.toString(),
    gasCost: ethers.formatEther(estimatedCost)
  };

  // Écrire dans un fichier de configuration
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Informations sauvegardées dans:", deploymentFile);

  // Instructions post-déploiement
  console.log("\n📋 PROCHAINES ÉTAPES:");
  console.log("1. ✅ Vérifier le contrat sur BSCScan:");
  console.log(`   npx hardhat verify --network bsc ${contractAddress} "${USDC_BSC_MAINNET}"`);
  
  console.log("\n2. ✅ Mettre à jour le frontend:");
  console.log("   - Copier l'adresse du contrat:", contractAddress);
  console.log("   - Modifier CONTRACTS.NFT_CONTRACT dans services/NFTService.ts");
  
  console.log("\n3. ✅ Tester le contrat:");
  console.log("   - Vérifier que les tiers sont correctement configurés");
  console.log("   - Tester un achat sur testnet avant mainnet");
  
  console.log("\n4. ✅ Configuration des métadonnées:");
  console.log("   - Préparer les images NFT et métadonnées JSON");
  console.log("   - Configurer les baseURI pour chaque tier");

  console.log("\n🎉 Déploiement terminé avec succès !");
  console.log("📄 Contrat:", contractAddress);
  console.log("🏦 Treasury:", TREASURY_WALLET);
  console.log("💰 Prêt à recevoir les paiements USDC automatiquement !");
}

// Fonction de nettoyage en cas d'erreur
async function cleanup() {
  console.log("\n🧹 Nettoyage en cours...");
  // Ici vous pouvez ajouter la logique de nettoyage si nécessaire
}

// Exécution du script avec gestion d'erreurs
main()
  .then(() => {
    console.log("\n✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur lors du déploiement:");
    console.error(error);
    cleanup().finally(() => {
      process.exit(1);
    });
  });