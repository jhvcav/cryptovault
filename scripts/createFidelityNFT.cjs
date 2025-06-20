// scripts/createFidelityNFT.cjs
const hre = require("hardhat");

async function main() {
  const contractAddress = "0xe7778688E645d0795c71837C2d44e08A1B6f6c0A";
  
  console.log("🎁 Création du NFT Fidélité...");
  
  // Se connecter au contrat déployé
  const CryptocaVaultNFT = await hre.ethers.getContractFactory("CryptocaVaultNFT");
  const contract = CryptocaVaultNFT.attach(contractAddress);
  
  // Créer le tier fidélité
  const tx = await contract.createNewTier(
    "Lumeran de l'Alliance",
    "Gardien eternel des serments sacres de CryptocaVault",
    0,  // price = 0 (gratuit)
    50, // supply
    120, // multiplier
    "https://olive-quick-dolphin-266.mypinata.cloud/ipfs/bafybeihd4hzlhs755vrk3ffrdaxaru34hyf7ksuvzycbtk5vqjlx72cyzi/",
    ["starter"],
    true, // isSpecial
    {
      gasLimit: 1000000
    }
  );
  
  console.log("⏳ Transaction envoyée:", tx.hash);
  await tx.wait();
  console.log("✅ NFT Fidélité créé avec succès !");
  
  // Marquer Jean comme éligible
  console.log("🔧 Marquage de Jean comme éligible...");
  const tx2 = await contract.setFidelityEligible(
    "0xec0cf7505c86e0ea33a2f2de4660e6a06abe92dd",
    true
  );
  
  console.log("⏳ Transaction eligibilité:", tx2.hash);
  await tx2.wait();
  console.log("✅ Jean marqué comme éligible !");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});