// SPDX-License-Identifier: MIT
const dotenv = require("dotenv");
const hre = require("hardhat");
const { ethers, run } = hre;

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy CryptoVaultStaking
  const CryptoVaultStaking = await ethers.getContractFactory("CryptoVaultStaking");
  const staking = await CryptoVaultStaking.deploy(
      process.env.USDT_ADDRESS,
      process.env.PANCAKESWAP_ROUTER
  );
  await staking.waitForDeployment();
  console.log("CryptoVaultStaking deployed to:", await staking.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });