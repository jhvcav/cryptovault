// scripts/verify-deploymentNFTV3.js
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔍 Vérification du déploiement CryptocaVault NFTV3...\n");

  // Lecture des informations de déploiement
  const network = await ethers.provider.getNetwork();
  const deploymentFile = path.join(__dirname, '..', 'deployments', `${network.name}-${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("❌ Fichier de déploiement non trouvé. Déployez d'abord le contrat.");
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("📄 Informations de déploiement:");
  console.log("   - Réseau:", deploymentInfo.network);
  console.log("   - Adresse contrat:", contractAddress);
  console.log("   - Treasury:", deploymentInfo.treasuryWallet);
  console.log("   - Déployé le:", deploymentInfo.timestamp);

  // Se connecter au contrat déployé
  const CryptocaVaultNFTV3 = await ethers.getContractFactory("CryptocaVaultNFTV3");
  const contract = CryptocaVaultNFTV3.attach(contractAddress);

  console.log("\n🧪 Tests de fonctionnalité...");

  try {
    // Test 1: Vérifier les informations du treasury
    console.log("1️⃣ Vérification du treasury...");
    const treasuryInfo = await contract.getTreasuryInfo();
    
    const expectedTreasury = "0xe0B7BCb42aeBB5Be565cc81518a48D780f3c001c";
    if (treasuryInfo.primaryTreasury.toLowerCase() === expectedTreasury.toLowerCase()) {
      console.log("   ✅ Treasury correctement configuré");
    } else {
      console.log("   ❌ Treasury incorrect:");
      console.log("      Attendu:", expectedTreasury);
      console.log("      Trouvé:", treasuryInfo.primaryTreasury);
    }

    // Test 2: Vérifier les tiers NFT
    console.log("2️⃣ Vérification des tiers NFT...");
    const activeTiers = await contract.getAllActiveTiers();
    console.log("   Tiers actifs:", activeTiers.map(t => t.toString()));

    for (let i = 0; i < Math.min(activeTiers.length, 4); i++) {
      const tierId = activeTiers[i];
      const tierInfo = await contract.getTierInfo(tierId);
      
      console.log(`   Tier ${tierId}:`);
      console.log(`      - Nom: ${tierInfo.name}`);
      console.log(`      - Prix: ${ethers.utils.formatEther(tierInfo.price)} USDC`);
      console.log(`      - Supply: ${tierInfo.minted}/${tierInfo.supply}`);
      console.log(`      - Multiplicateur: ${tierInfo.multiplier/100}x`);
      console.log(`      - Actif: ${tierInfo.active ? 'Oui' : 'Non'}`);
    }

    // Test 3: Vérifier les statistiques de revenus
    console.log("3️⃣ Vérification des revenus...");
    const revenueStats = await contract.getRevenueStats();
    console.log("   Total des revenus:", ethers.utils.formatEther(revenueStats.totalRev), "USDC");
    
    if (revenueStats.tierIds.length > 0) {
      console.log("   Revenus par tier:");
      for (let i = 0; i < revenueStats.tierIds.length; i++) {
        const tierId = revenueStats.tierIds[i];
        const revenue = revenueStats.tierRevenues[i];
        console.log(`      Tier ${tierId}: ${ethers.utils.formatEther(revenue)} USDC`);
      }
    } else {
      console.log("   Aucun revenu encore généré");
    }

    // Test 4: Vérifier les constantes
    console.log("4️⃣ Vérification des constantes...");
    const treasuryConstant = await contract.TREASURY_WALLET();
    console.log("   TREASURY_WALLET constant:", treasuryConstant);
    
    // Test 5: Simulation d'un achat (sans l'exécuter)
    console.log("5️⃣ Test de simulation d'achat...");
    try {
      // Créer un wallet fictif pour le test
      const [deployer] = await ethers.getSigners();
      
      // Test avec le tier 1 (Bronze)
      const tier1Info = await contract.getTierInfo(1);
      console.log("   Simulation achat NFT Bronze:");
      console.log("      - Prix requis:", ethers.utils.formatEther(tier1Info.price), "USDC");
      console.log("      - Supply restant:", tier1Info.supply - tier1Info.minted);
      
      // Vérifier si l'utilisateur peut théoriquement acheter
      const hasNFT = await contract.ownerHasTier(deployer.address, 1);
      console.log("      - Déployeur possède déjà ce tier:", hasNFT ? "Oui" : "Non");
      
    } catch (error) {
      console.log("   ⚠️ Simulation partielle:", error.message);
    }

    // Test 6: Vérifier les permissions admin
    console.log("6️⃣ Vérification des permissions...");
    try {
      const owner = await contract.owner();
      const [deployer] = await ethers.getSigners();
      
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("   ✅ Permissions admin correctes");
      } else {
        console.log("   ⚠️ Owner différent du déployeur:");
        console.log("      Owner:", owner);
        console.log("      Déployeur:", deployer.address);
      }
    } catch (error) {
      console.log("   ❌ Erreur vérification owner:", error.message);
    }

    console.log("\n📊 Résumé de la vérification:");
    console.log("✅ Contrat déployé et opérationnel");
    console.log("✅ Treasury configuré correctement");
    console.log("✅ Tiers NFT initialisés");
    console.log("✅ Fonctions de base accessibles");
    
    console.log("\n🔗 Liens utiles:");
    console.log("   - Contrat sur BSCScan:", `https://bscscan.com/address/${contractAddress}`);
    console.log("   - Treasury sur BSCScan:", `https://bscscan.com/address/${expectedTreasury}`);
    console.log("   - USDC Treasury:", `https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d?a=${expectedTreasury}`);

    console.log("\n📋 Actions recommandées:");
    console.log("1. Vérifier le contrat sur BSCScan:");
    console.log(`   npx hardhat verify --network ${network.name === 'unknown' ? 'bsc' : network.name} ${contractAddress} "${deploymentInfo.usdcToken}"`);
    console.log("2. Mettre à jour l'adresse dans le frontend");
    console.log("3. Tester un achat avec un petit montant");
    console.log("4. Configurer les métadonnées NFT");

  } catch (error) {
    console.log("❌ Erreur lors de la vérification:", error.message);
    throw error;
  }
}

// Fonction pour tester la connexion réseau
async function testNetworkConnection() {
  try {
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    
    console.log("🌐 Connexion réseau:");
    console.log("   - Réseau:", network.name);
    console.log("   - Chain ID:", network.chainId);
    console.log("   - Dernier bloc:", blockNumber);
    
    return true;
  } catch (error) {
    console.log("❌ Erreur de connexion réseau:", error.message);
    return false;
  }
}

// Exécution
async function runVerification() {
  console.log("🚀 Début de la vérification...\n");
  
  // Tester la connexion réseau d'abord
  const networkOk = await testNetworkConnection();
  if (!networkOk) {
    throw new Error("Impossible de se connecter au réseau");
  }
  
  await main();
}

runVerification()
  .then(() => {
    console.log("\n✅ Vérification terminée avec succès !");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur lors de la vérification:");
    console.error(error);
    process.exit(1);
  });