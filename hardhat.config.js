// hardhat.config.js
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    // BSC Mainnet
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 3000000000, // 3 gwei
      gas: 2100000,
      timeout: 60000,
      confirmations: 2
    },
    
    // BSC Testnet
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000, // 10 gwei
      gas: 2100000,
      timeout: 60000,
      confirmations: 1
    },
    
    // Localhost pour tests
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  
  // Configuration pour la vérification des contrats
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      }
    ]
  },
  
  // Configuration des gas
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 3, // gwei pour BSC
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  
  // Chemins personnalisés
  paths: {
    sources: "./contract_NFT",  // Pointe vers le dossier contract_NFT
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  // Configuration Mocha pour les tests
  mocha: {
    timeout: 60000
  }
};