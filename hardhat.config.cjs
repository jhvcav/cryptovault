const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
const { default: path } = require("path");
dotenv.config();

// Vérification de la présence de la clé privée
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is required in environment variables");
}

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 5000000000 // 5 gwei
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 10000000000 // 10 gwei
    }
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    }
  },
path: {
    source: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts_output"
},
}

// Exporter en format CommonJS
module.exports = config;