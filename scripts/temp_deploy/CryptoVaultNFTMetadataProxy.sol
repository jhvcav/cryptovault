
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
