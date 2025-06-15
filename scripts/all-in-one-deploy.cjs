// scripts/all-in-one-deploy-v6.cjs

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const solc = require('solc');
require('dotenv').config();

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/';
const ORIGINAL_NFT_CONTRACT = '0x3b9E6cad77E65e153321C91Ac5225a4C564b3aE4';
const NAME = 'CryptoVault Access NFT';
const SYMBOL = 'CVNFT';
const METADATA_BASE_URI = 'https://gateway.pinata.cloud/ipfs/bafybeiesm4ju35ktqljawqnlrh2atyzhjf2eqba2b5ifkglniymb4wvy6u/';

// Vérifier la clé privée
if (!PRIVATE_KEY) {
  console.error('PRIVATE_KEY n\'est pas défini dans .env');
  process.exit(1);
}

// Créer le dossier temporaire
const TEMP_DIR = path.join(__dirname, 'temp_deploy');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Code du contrat
const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @dev Interface for the Ownable contract
 */
interface Ownable {
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}

/**
 * @title Simple Ownable implementation
 */
contract OwnableImpl is Ownable {
    address private _owner;
    
    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }
    
    function owner() public view override returns (address) {
        return _owner;
    }
    
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @title CryptoVaultNFTMetadataProxy
 * @dev Contrat proxy pour servir les métadonnées des NFT CryptoVault
 */
contract CryptoVaultNFTMetadataProxy is OwnableImpl {
    address public immutable originalNFTContract;
    string public name;
    string public symbol;
    
    // Mappings pour stocker les URIs des métadonnées
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping pour les URI de base par tier
    mapping(uint256 => string) private _tierBaseURIs;
    
    // Mapping token ID => tier
    mapping(uint256 => uint256) private _tokenTiers;
    
    // Event pour le suivi des mises à jour
    event TokenURIUpdated(uint256 indexed tokenId, string newURI);
    event TierBaseURIUpdated(uint256 indexed tierId, string newBaseURI);
    event TokenTierSet(uint256 indexed tokenId, uint256 tierId);
    
    /**
     * @dev Constructeur
     * @param _originalNFTContract Adresse du contrat NFT original
     * @param _name Nom de la collection NFT
     * @param _symbol Symbole de la collection NFT
     */
    constructor(address _originalNFTContract, string memory _name, string memory _symbol) {
        originalNFTContract = _originalNFTContract;
        name = _name;
        symbol = _symbol;
    }
    
    /**
     * @dev Définir l'URI d'un token spécifique
     * @param tokenId ID du token
     * @param _tokenURI Nouvelle URI pour le token
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        _tokenURIs[tokenId] = _tokenURI;
        emit TokenURIUpdated(tokenId, _tokenURI);
    }
    
    /**
     * @dev Définir l'URI de base pour un tier
     * @param tierId ID du tier
     * @param baseURI URI de base pour le tier
     */
    function setTierBaseURI(uint256 tierId, string memory baseURI) external onlyOwner {
        _tierBaseURIs[tierId] = baseURI;
        emit TierBaseURIUpdated(tierId, baseURI);
    }
    
    /**
     * @dev Définir le tier d'un token
     * @param tokenId ID du token
     * @param tierId ID du tier
     */
    function setTokenTier(uint256 tokenId, uint256 tierId) external onlyOwner {
        _tokenTiers[tokenId] = tierId;
        emit TokenTierSet(tokenId, tierId);
    }
    
    /**
     * @dev Mettre à jour plusieurs tokens d'un même tier en une seule transaction
     * @param tokenIds Liste des IDs de tokens
     * @param tierId ID du tier
     */
    function batchSetTokenTier(uint256[] calldata tokenIds, uint256 tierId) external onlyOwner {
        for (uint i = 0; i < tokenIds.length; i++) {
            _tokenTiers[tokenIds[i]] = tierId;
            emit TokenTierSet(tokenIds[i], tierId);
        }
    }
    
    /**
     * @dev Obtenir l'URI d'un token
     * @param tokenId ID du token
     * @return L'URI des métadonnées du token
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        // Si une URI spécifique est définie, l'utiliser
        if (bytes(_tokenURIs[tokenId]).length > 0) {
            return _tokenURIs[tokenId];
        }
        
        // Sinon, construire l'URI à partir de l'URI de base du tier
        uint256 tierId = _tokenTiers[tokenId];
        if (tierId > 0 && bytes(_tierBaseURIs[tierId]).length > 0) {
            return string(abi.encodePacked(_tierBaseURIs[tierId], toString(tokenId), ".json"));
        }
        
        // Fallback si rien n'est défini
        return "";
    }
    
    /**
     * @dev Obtenir le tier d'un token
     * @param tokenId ID du token
     * @return ID du tier
     */
    function getTokenTier(uint256 tokenId) external view returns (uint256) {
        return _tokenTiers[tokenId];
    }
    
    /**
     * @dev Convertir un uint256 en string
     * @param value Valeur à convertir
     * @return La représentation string de la valeur
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Cette fonction implémente simplement une conversion uint256 vers string
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}
`;

// Écrire le fichier de contrat
const contractPath = path.join(TEMP_DIR, 'CryptoVaultNFTMetadataProxy.sol');
fs.writeFileSync(contractPath, contractSource);

// Compiler le contrat
async function compileContract() {
  console.log('Compilation du contrat...');
  
  const input = {
    language: 'Solidity',
    sources: {
      'CryptoVaultNFTMetadataProxy.sol': {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // Vérifier les erreurs
  if (output.errors) {
    const hasError = output.errors.some(error => error.severity === 'error');
    if (hasError) {
      console.error('Erreurs de compilation:', output.errors);
      process.exit(1);
    } else {
      console.warn('Avertissements de compilation:', output.errors);
    }
  }
  
  const contract = output.contracts['CryptoVaultNFTMetadataProxy.sol']['CryptoVaultNFTMetadataProxy'];
  return contract;
}

// Déployer le contrat
async function deployContract(contractOutput) {
  console.log('Déploiement du contrat...');
  
  // ethers.js v6 a une API différente
  const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Créer la factory du contrat
  const factory = new ethers.ContractFactory(
    contractOutput.abi,
    contractOutput.evm.bytecode.object,
    wallet
  );
  
  // Déployer le contrat
  const contract = await factory.deploy(
    ORIGINAL_NFT_CONTRACT,
    NAME,
    SYMBOL,
    {
      gasLimit: 3000000,
      // ethers.js v6 utilise parseUnits différemment
      gasPrice: ethers.parseUnits('5', 'gwei')
    }
  );
  
  console.log('Contrat en cours de déploiement, en attente de confirmation...');
  // ethers.js v6 utilise waitForDeployment au lieu de deployed
  await contract.waitForDeployment();
  
  console.log(`Contrat déployé à l'adresse: ${await contract.getAddress()}`);
  return contract;
}

// Configurer le contrat
async function configureContract(contract) {
  console.log('Attente de 10 secondes avant la configuration...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('Configuration des URIs de base pour chaque tier...');
  for (let tier = 1; tier <= 4; tier++) {
    const tx = await contract.setTierBaseURI(tier, METADATA_BASE_URI, {
      gasLimit: 200000
    });
    await tx.wait();
    console.log(`- URI configurée pour le tier ${tier}`);
  }
  
  console.log('Association des tokens à leurs tiers respectifs...');
  for (let tokenId = 1; tokenId <= 4; tokenId++) {
    const tx = await contract.setTokenTier(tokenId, tokenId, {
      gasLimit: 200000
    });
    await tx.wait();
    console.log(`- Token #${tokenId} associé au tier ${tokenId}`);
  }
  
  // Vérifier
  const uri1 = await contract.tokenURI(1);
  console.log(`\nURI pour le token #1: ${uri1}`);
}

// Fonction principale
async function main() {
  try {
    // Compiler
    const contractOutput = await compileContract();
    
    // Déployer
    const contract = await deployContract(contractOutput);
    
    // Configurer
    await configureContract(contract);
    
    console.log('\nDéploiement et configuration terminés avec succès!');
    
    // Instructions pour la vérification sur BSCScan
    console.log('\nPour vérifier le contrat sur BSCScan, allez sur:');
    console.log(`https://bscscan.com/address/${await contract.getAddress()}#code`);
    
    // Sauvegarder les informations du contrat
    const contractInfo = {
      address: await contract.getAddress(),
      abi: contractOutput.abi,
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(TEMP_DIR, 'contract-info.json'),
      JSON.stringify(contractInfo, null, 2)
    );
    
    console.log(`\nInformations du contrat sauvegardées dans ${path.join(TEMP_DIR, 'contract-info.json')}`);
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
console.log('Démarrage du déploiement...');
main();