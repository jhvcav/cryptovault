// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CryptoVaultNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    // Structure pour definir les tiers de NFT (extensible)
    struct NFTTier {
        uint256 price;           // Prix en USDC (avec 18 decimales)
        uint256 supply;          // Supply total
        uint256 minted;          // Nombre dejà minte
        string baseURI;          // URI de base pour les metadonnees
        bool active;             // Si le tier est actif
        string name;             // Nom du tier
        string description;      // Description du tier
        uint256 multiplier;      // Multiplicateur (en centiemes, ex: 120 = 1.2x)
        string[] accessPlans;    // Plans accessibles
        uint256 createdAt;       // Timestamp de creation
    }
    
    // Mapping des tiers NFT (peut aller au-delà de 4)
    mapping(uint256 => NFTTier) public nftTiers;
    
    // Liste des tiers actifs pour l'iteration
    uint256[] public activeTiers;
    
    // Mapping pour suivre le tier de chaque NFT
    mapping(uint256 => uint256) public nftToTier;
    
    // Mapping pour suivre les NFT par proprietaire et tier
    mapping(address => mapping(uint256 => bool)) public ownerHasTier;
    
    // Mapping pour les NFT speciaux (evenements, partenariats, etc.)
    mapping(uint256 => bool) public isSpecialTier;

    // Ajouter une mapping pour tracker les tokens par propriétaire
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    
    // Adresse du token USDC sur BSC
    IERC20 public immutable usdcToken;
    
    // Adresse treasury pour recevoir automatiquement les paiements
    address public constant TREASURY_WALLET = 0xe0B7BCb42aeBB5Be565cc81518a48D780f3c001c;
    
    // Adresse de backup treasury (au cas où)
    address public backupTreasuryWallet;
    
    // Compteur pour les token IDs
    uint256 private _tokenIdCounter;
    
    // Compteur pour les nouveaux tiers
    uint256 public nextTierId = 5; // Commence apres les 4 tiers initiaux
    
    // Stats des revenus
    uint256 public totalRevenue; // Total des revenus generes
    mapping(uint256 => uint256) public tierRevenue; // Revenus par tier
    
    // Events
    event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 tier, uint256 price);
    event TierCreated(uint256 indexed tier, string name, uint256 price, uint256 supply);
    event TierUpdated(uint256 indexed tier, uint256 price, uint256 supply);
    event FidelityNFTClaimed(address indexed user, uint256 indexed tokenId);
    event SpecialNFTMinted(address indexed to, uint256 indexed tokenId, uint256 tier, string reason);
    event RevenueGenerated(uint256 indexed tier, uint256 amount, address treasury);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    
    constructor(
        address _usdcToken
    ) ERC721("CryptoVault Access NFT", "CVNFT") {
        usdcToken = IERC20(_usdcToken);
        backupTreasuryWallet = TREASURY_WALLET; // Par defaut, même adresse
        
        // Initialiser les tiers de base
        _initializeBaseTiers();
    }
    
    function _initializeBaseTiers() private {
        // NFT Bronze (Tier 1)
        _createTier(1, NFTTier({
            price: 120 * 10**18,
            supply: 1000,
            minted: 0,
            baseURI: "https://api.cryptovault.com/nft/bronze/",
            active: true,
            name: "NFT Bronze",
            description: "Acces aux strategies de base avec bonus 20%",
            multiplier: 120, // 1.2x
            accessPlans: new string[](1),
            createdAt: block.timestamp
        }));
        nftTiers[1].accessPlans[0] = "starter";
        
        // NFT Argent (Tier 2)
        _createTier(2, NFTTier({
            price: 250 * 10**18,
            supply: 500,
            minted: 0,
            baseURI: "https://api.cryptovault.com/nft/silver/",
            active: true,
            name: "NFT Argent",
            description: "Acces etendu avec bonus 50%",
            multiplier: 150, // 1.5x
            accessPlans: new string[](2),
            createdAt: block.timestamp
        }));
        nftTiers[2].accessPlans[0] = "starter";
        nftTiers[2].accessPlans[1] = "standard";
        
        // NFT Or (Tier 3)
        _createTier(3, NFTTier({
            price: 500 * 10**18,
            supply: 200,
            minted: 0,
            baseURI: "https://api.cryptovault.com/nft/gold/",
            active: true,
            name: "NFT Or",
            description: "Acces premium avec bonus 100%",
            multiplier: 200, // 2.0x
            accessPlans: new string[](3),
            createdAt: block.timestamp
        }));
        nftTiers[3].accessPlans[0] = "starter";
        nftTiers[3].accessPlans[1] = "standard";
        nftTiers[3].accessPlans[2] = "premium";
        
        // NFT Privilege (Tier 4)
        _createTier(4, NFTTier({
            price: 1000 * 10**18,
            supply: 50,
            minted: 0,
            baseURI: "https://api.cryptovault.com/nft/privilege/",
            active: true,
            name: "NFT Privilege",
            description: "Acces exclusif avec bonus 150%",
            multiplier: 250, // 2.5x
            accessPlans: new string[](4),
            createdAt: block.timestamp
        }));
        nftTiers[4].accessPlans[0] = "starter";
        nftTiers[4].accessPlans[1] = "standard";
        nftTiers[4].accessPlans[2] = "premium";
        nftTiers[4].accessPlans[3] = "privilege";
    }
    
    function _createTier(uint256 tierId, NFTTier memory tier) private {
        nftTiers[tierId] = tier;
        activeTiers.push(tierId);
    }
    
    // ========== FONCTIONS PUBLIQUES D'ACHAT AVEC TREASURY AUTO ==========
    
    function purchaseNFT(uint256 tier) external nonReentrant {
        require(nftTiers[tier].active, "Tier non actif");
        require(nftTiers[tier].minted < nftTiers[tier].supply, "Supply epuisee");
        require(nftTiers[tier].price > 0, "Tier invalide");
        
        uint256 price = nftTiers[tier].price;
        
        // Verifier que l'utilisateur a approuve le montant
        require(
            usdcToken.allowance(msg.sender, address(this)) >= price,
            "Allowance USDC insuffisante"
        );
        
        // Verifier que l'utilisateur a suffisamment d'USDC
        require(
            usdcToken.balanceOf(msg.sender) >= price,
            "Balance USDC insuffisante"
        );
        
        // Transferer les USDC directement vers le treasury
        bool success = usdcToken.transferFrom(msg.sender, TREASURY_WALLET, price);
        require(success, "Transfert USDC vers treasury echoue");
        
        // Mettre à jour les stats de revenus
        totalRevenue += price;
        tierRevenue[tier] += price;
        
        // Minter le NFT
        _mintNFT(msg.sender, tier, false);
        
        // Emettre les evenements
        emit NFTPurchased(msg.sender, _tokenIdCounter, tier, price);
        emit RevenueGenerated(tier, price, TREASURY_WALLET);
    }
    
    function claimFidelityNFT(address fidelUser) external onlyOwner {
        require(!ownerHasTier[fidelUser][4], "NFT Privilege deja possede");
        require(nftTiers[4].minted < nftTiers[4].supply, "Supply epuisee");
        
        _mintNFT(fidelUser, 4, true);
        
        emit FidelityNFTClaimed(fidelUser, _tokenIdCounter);
    }
    
    // ========== FONCTIONS D'ADMINISTRATION POUR NOUVEAUX TIERS ==========
    
    /**
     * @dev Creer un nouveau tier NFT
     */
    function createNewTier(
        string memory name,
        string memory description,
        uint256 price,
        uint256 supply,
        uint256 multiplier,
        string memory baseURI,
        string[] memory accessPlans,
        bool isSpecial
    ) external onlyOwner returns (uint256) {
        uint256 newTierId = nextTierId;
        nextTierId++;
        
        nftTiers[newTierId] = NFTTier({
            price: price,
            supply: supply,
            minted: 0,
            baseURI: baseURI,
            active: true,
            name: name,
            description: description,
            multiplier: multiplier,
            accessPlans: accessPlans,
            createdAt: block.timestamp
        });
        
        activeTiers.push(newTierId);
        
        if (isSpecial) {
            isSpecialTier[newTierId] = true;
        }
        
        emit TierCreated(newTierId, name, price, supply);
        
        return newTierId;
    }
    
    /**
     * @dev Creer un NFT d'evenement (gratuit, mais peut generer des revenus via mint special)
     */
    function createEventNFT(
        string memory name,
        string memory description,
        uint256 supply,
        uint256 multiplier,
        string memory baseURI,
        string[] memory accessPlans
    ) external onlyOwner returns (uint256) {
        uint256 newTierId = nextTierId;
        nextTierId++;
        
        nftTiers[newTierId] = NFTTier({
            price: 0, // Prix gratuit
            supply: supply,
            minted: 0,
            baseURI: baseURI,
            active: true,
            name: name,
            description: description,
            multiplier: multiplier,
            accessPlans: accessPlans,
            createdAt: block.timestamp
        });
        
        activeTiers.push(newTierId);
        isSpecialTier[newTierId] = true; // NFT special
        
        emit TierCreated(newTierId, name, 0, supply);
        
        return newTierId;
    }
    
    /**
     * @dev Creer un NFT de partenariat
     */
    function createPartnershipNFT(
        string memory partnerName,
        string memory description,
        uint256 price,
        uint256 supply,
        uint256 multiplier,
        string memory baseURI,
        string[] memory accessPlans
    ) external onlyOwner returns (uint256) {
        string memory name = string(abi.encodePacked("NFT ", partnerName));
        
        uint256 newTierId = nextTierId;
        nextTierId++;
        
        nftTiers[newTierId] = NFTTier({
            price: price,
            supply: supply,
            minted: 0,
            baseURI: baseURI,
            active: true,
            name: name,
            description: description,
            multiplier: multiplier,
            accessPlans: accessPlans,
            createdAt: block.timestamp
        });
        
        activeTiers.push(newTierId);
        isSpecialTier[newTierId] = true; // NFT special
        
        emit TierCreated(newTierId, name, price, supply);
        
        return newTierId;
    }
    
    /**
     * @dev Minter un NFT special directement à un utilisateur
     */
    function mintSpecialNFT(
        address to,
        uint256 tier,
        string memory reason
    ) external onlyOwner {
        require(nftTiers[tier].active, "Tier non actif");
        require(isSpecialTier[tier], "Pas un tier special");
        require(nftTiers[tier].minted < nftTiers[tier].supply, "Supply epuisee");
        
        _mintNFT(to, tier, true);
        
        emit SpecialNFTMinted(to, _tokenIdCounter, tier, reason);
    }
    
    /**
     * @dev Mettre à jour un tier existant
     */
    function updateTier(
        uint256 tier,
        uint256 newPrice,
        uint256 newSupply,
        bool active
    ) external onlyOwner {
        require(nftTiers[tier].createdAt > 0, "Tier inexistant");
        require(newSupply >= nftTiers[tier].minted, "Supply inferieur au minted");
        
        nftTiers[tier].price = newPrice;
        nftTiers[tier].supply = newSupply;
        nftTiers[tier].active = active;
        
        emit TierUpdated(tier, newPrice, newSupply);
    }
    
    /**
     * @dev Ajouter des plans d'acces a un tier
     */
    function addAccessPlansToTier(uint256 tier, string[] memory newPlans) external onlyOwner {
        require(nftTiers[tier].createdAt > 0, "Tier inexistant");
        
        for (uint i = 0; i < newPlans.length; i++) {
            nftTiers[tier].accessPlans.push(newPlans[i]);
        }
    }
    
    // ========== FONCTIONS DE GESTION TREASURY ==========
    
    /**
     * @dev Mettre à jour l'adresse treasury de backup (securite)
     */
    function updateBackupTreasury(address newBackupTreasury) external onlyOwner {
        require(newBackupTreasury != address(0), "Adresse invalide");
        address oldTreasury = backupTreasuryWallet;
        backupTreasuryWallet = newBackupTreasury;
        
        emit TreasuryUpdated(oldTreasury, newBackupTreasury);
    }
    
    /**
     * @dev Fonction d'urgence pour recuperer des tokens bloques
     * (Normalement, les USDC vont directement au treasury, mais au cas où)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Adresse token invalide");
        
        IERC20(token).transfer(TREASURY_WALLET, amount);
    }
    
    /**
     * @dev Obtenir les statistiques de revenus
     */
    function getRevenueStats() external view returns (
        uint256 totalRev,
        uint256[] memory tierIds,
        uint256[] memory tierRevenues
    ) {
        tierIds = new uint256[](activeTiers.length);
        tierRevenues = new uint256[](activeTiers.length);
        
        for (uint i = 0; i < activeTiers.length; i++) {
            tierIds[i] = activeTiers[i];
            tierRevenues[i] = tierRevenue[activeTiers[i]];
        }
        
        return (totalRevenue, tierIds, tierRevenues);
    }
    
    /**
     * @dev Verifier le statut du treasury
     */
    function getTreasuryInfo() external view returns (
        address primaryTreasury,
        address backupTreasury,
        uint256 totalGenerated
    ) {
        return (TREASURY_WALLET, backupTreasuryWallet, totalRevenue);
    }
    
    // ========== FONCTIONS DE LECTURE ==========
    
    function getAllActiveTiers() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint i = 0; i < activeTiers.length; i++) {
            if (nftTiers[activeTiers[i]].active) {
                activeCount++;
            }
        }
        
        uint256[] memory result = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint i = 0; i < activeTiers.length; i++) {
            if (nftTiers[activeTiers[i]].active) {
                result[index] = activeTiers[i];
                index++;
            }
        }
        
        return result;
    }
    
    function getTierInfo(uint256 tier) external view returns (NFTTier memory) {
        return nftTiers[tier];
    }
    
    function getUserHighestTier(address user) external view returns (uint256) {
        uint256 highest = 0;
        
        for (uint i = 0; i < activeTiers.length; i++) {
            uint256 tierId = activeTiers[i];
            if (ownerHasTier[user][tierId]) {
                if (nftTiers[tierId].multiplier > nftTiers[highest].multiplier) {
                    highest = tierId;
                }
            }
        }
        
        return highest;
    }
    
    function getUserMultiplier(address user) external view returns (uint256) {
        uint256 highestTier = this.getUserHighestTier(user);
        if (highestTier == 0) return 100; // 1.0x = 100
        
        return nftTiers[highestTier].multiplier;
    }
    
    function getTierAccessPlans(uint256 tier) external view returns (string[] memory) {
        return nftTiers[tier].accessPlans;
    }
    
    function getRemainingSupply(uint256 tier) external view returns (uint256) {
        return nftTiers[tier].supply - nftTiers[tier].minted;
    }
    
    function getSpecialTiers() external view returns (uint256[] memory) {
        uint256 specialCount = 0;
        
        for (uint i = 0; i < activeTiers.length; i++) {
            if (isSpecialTier[activeTiers[i]]) {
                specialCount++;
            }
        }
        
        uint256[] memory result = new uint256[](specialCount);
        uint256 index = 0;
        
        for (uint i = 0; i < activeTiers.length; i++) {
            if (isSpecialTier[activeTiers[i]]) {
                result[index] = activeTiers[i];
                index++;
            }
        }
        
        return result;
    }
    
    // Fonction pour obtenir un token par index
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "Index hors limites");
        return _ownedTokens[owner][index];
    }
    
    // ========== FONCTIONS INTERNES ==========
    
    function _mintNFT(address to, uint256 tier, bool /*free */) private {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(to, tokenId);
        nftToTier[tokenId] = tier;
        ownerHasTier[to][tier] = true;
        nftTiers[tier].minted++;
        
        // Mettre à jour le tracking des tokens
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length - 1;
    }
    
    function _hasNFTOfTier(address user, uint256 tier) private view returns (bool) {
        uint256 balance = balanceOf(user);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(user, i);
            if (nftToTier[tokenId] == tier) {
                return true;
            }
        }
        return false;
    }
    
    // ========== OVERRIDE FUNCTIONS ==========
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        address owner = ownerOf(tokenId);
        uint256 lastTokenIndex = _ownedTokens[owner].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        
        // Reorganiser le tableau _ownedTokens
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[owner][lastTokenIndex];
            _ownedTokens[owner][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }
        
        _ownedTokens[owner].pop();
        delete _ownedTokensIndex[tokenId];
        
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token inexistant");
        
        uint256 tier = nftToTier[tokenId];
        return string(abi.encodePacked(nftTiers[tier].baseURI, Strings.toString(tokenId), ".json"));
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Transfer override pour mettre à jour ownerHasTier et _ownedTokens
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0)) {
            uint256 tier = nftToTier[tokenId];
            
            // Mettre à jour _ownedTokens pour l'ancien propriétaire
            uint256 lastTokenIndex = _ownedTokens[from].length - 1;
            uint256 tokenIndex = _ownedTokensIndex[tokenId];
            
            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
                _ownedTokens[from][tokenIndex] = lastTokenId;
                _ownedTokensIndex[lastTokenId] = tokenIndex;
            }
            
            _ownedTokens[from].pop();
            delete _ownedTokensIndex[tokenId];
            
            // Mettre à jour _ownedTokens pour le nouveau propriétaire
            _ownedTokens[to].push(tokenId);
            _ownedTokensIndex[tokenId] = _ownedTokens[to].length - 1;
            
            // Mettre à jour ownerHasTier
            if (balanceOf(from) == 0 || !_hasNFTOfTier(from, tier)) {
                ownerHasTier[from][tier] = false;
            }
            
            ownerHasTier[to][tier] = true;
        } else if (from == address(0)) {
            // Mint: déjà géré dans _mintNFT
        }
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function pauseTier(uint256 tier) external onlyOwner {
        nftTiers[tier].active = false;
    }
    
    function unpauseTier(uint256 tier) external onlyOwner {
        nftTiers[tier].active = true;
    }
}