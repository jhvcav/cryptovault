// SPDX-License-Identifier: MIT
const dotenv = require("dotenv");
const hre = require("hardhat");
const { ethers } = hre;

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Updating plans with account:", deployer.address);
  
  // Récupérer le contrat déployé
  const Staking = await ethers.getContractFactory("Staking");
  const staking = Staking.attach(process.env.STAKING_ADDRESS);
  
  // Désactiver les anciens plans si nécessaire
  await staking.togglePlan(0);
  await staking.togglePlan(1);
  await staking.togglePlan(2);
  console.log("Anciens plans désactivés");

  // Créer les nouveaux plans
  await staking.createPlan(
    2500, // 25% APR
    30,   // 30 jours
    ethers.parseUnits("50", 18) // 50 tokens minimum
  );
  console.log("Created new plan 1: 25% APR, 30 days");

  await staking.createPlan(
    3000, // 30% APR
    60,   // 60 jours
    ethers.parseUnits("200", 18) // 200 tokens minimum
  );
  console.log("Created new plan 2: 30% APR, 60 days");

  await staking.createPlan(
    3500, // 35% APR
    90,   // 90 jours
    ethers.parseUnits("500", 18) // 500 tokens minimum
  );
  console.log("Created new plan 3: 35% APR, 90 days");

  console.log("Plans updated successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });