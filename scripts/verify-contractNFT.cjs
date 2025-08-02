// scripts/verify-contract.cjs

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuration
const CONTRACT_ADDRESS = '0x4B834aa2C64c7030d7F2920E760469354f72686C';
const ORIGINAL_NFT_CONTRACT = '0x3b9E6cad77E65e153321C91Ac5225a4C564b3aE4';
const NAME = 'CryptocaVault Access NFT';
const SYMBOL = 'CVNFT';
const NETWORK = 'bsc';

// Chemin vers le fichier du contrat
const TEMP_DIR = path.join(__dirname, 'temp_deploy');
const CONTRACT_PATH = path.join(TEMP_DIR, 'CryptoVaultNFTMetadataProxy.sol');

// Vérifier si le contrat existe
if (!fs.existsSync(CONTRACT_PATH)) {
  console.error(`Le fichier du contrat n'existe pas: ${CONTRACT_PATH}`);
  console.log('Création du fichier du contrat...');
  
  // Code du contrat
  const contractSource = `// SPDX-License-Identifier: MIT
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
}`;

  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  // Écrire le fichier du contrat
  fs.writeFileSync(CONTRACT_PATH, contractSource, 'utf8');
  console.log(`Fichier du contrat créé: ${CONTRACT_PATH}`);
}

// Vérifier le contrat
try {
  console.log('Vérification du contrat sur BSCScan...');
  
  // Construire la commande hardhat pour la vérification
  const verifyCommand = `npx hardhat verify --network ${NETWORK} ${CONTRACT_ADDRESS} "${ORIGINAL_NFT_CONTRACT}" "${NAME}" "${SYMBOL}"`;
  
  console.log(`Exécution de la commande: ${verifyCommand}`);
  
  // Exécuter la commande
  const output = execSync(verifyCommand, { encoding: 'utf8' });
  console.log(output);
  
  console.log('Vérification terminée !');
  console.log(`Vous pouvez voir votre contrat vérifié sur: https://bscscan.com/address/${CONTRACT_ADDRESS}#code`);
  
} catch (error) {
  console.error('Erreur lors de la vérification:', error.message);
  
  // Si le contrat est déjà vérifié, ce n'est pas une erreur grave
  if (error.message.includes('Already Verified') || error.message.includes('Contract source code already verified')) {
    console.log('Le contrat semble déjà être vérifié sur BSCScan.');
    console.log(`Vous pouvez voir votre contrat vérifié sur: https://bscscan.com/address/${CONTRACT_ADDRESS}#code`);
  } else {
    // Afficher les instructions pour la vérification manuelle
    console.log('\nSi la vérification automatique échoue, vous pouvez vérifier manuellement le contrat:');
    console.log('1. Accédez à https://bscscan.com/address/' + CONTRACT_ADDRESS + '#code');
    console.log('2. Cliquez sur "Verify and Publish"');
    console.log('3. Sélectionnez "Solidity (Single file)"');
    console.log('4. Choisissez la version du compilateur 0.8.19');
    console.log('5. Activez l\'optimisation (200 runs)');
    console.log('6. Copiez le code du contrat depuis le fichier du script');
    console.log('7. Fournissez les arguments du constructeur:');
    console.log(`   "${ORIGINAL_NFT_CONTRACT}","${NAME}","${SYMBOL}"`);
    
    process.exit(1);
  }
}