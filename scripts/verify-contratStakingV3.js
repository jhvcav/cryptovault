import dotenv from "dotenv";
import hre from "hardhat";
dotenv.config();

async function main() {
  // Adresse du contrat déployé
  const CONTRACT_ADDRESS = "0xcF76Fb0D057228BC84772cA654E17ab580725388"; // Remplacez par l'adresse réelle
  
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.FEE_COLLECTOR_ADDRESS) {
    throw new Error("FEE_COLLECTOR_ADDRESS not set in environment variables");
  }
  
  if (!process.env.NFT_CONTRACT_ADDRESS) {
    throw new Error("NFT_CONTRACT_ADDRESS not set in environment variables");
  }

  console.log("Verifying contract at:", CONTRACT_ADDRESS);
  console.log("Constructor arguments:");
  console.log("- FEE_COLLECTOR_ADDRESS:", process.env.FEE_COLLECTOR_ADDRESS);
  console.log("- NFT_CONTRACT_ADDRESS:", process.env.NFT_CONTRACT_ADDRESS);

  try {
    await hre.run("verify:verify", {
      address: CONTRACT_ADDRESS,
      constructorArguments: [
        process.env.FEE_COLLECTOR_ADDRESS,
        process.env.NFT_CONTRACT_ADDRESS
      ],
    });
    
    console.log("✅ Contract verified successfully!");
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Error verifying contract:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });