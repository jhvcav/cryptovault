// SPDX-License-Identifier: MIT
const dotenv = require("dotenv");
const hre = require("hardhat");
const { ethers } = hre;

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy CryptoVaultLPFarming
  const CryptoVaultLPFarming = await ethers.getContractFactory("CryptoVaultLPFarming");
  const farming = await CryptoVaultLPFarming.deploy();
  await farming.waitForDeployment();
  console.log("CryptoVaultLPFarming deployed to:", await farming.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });