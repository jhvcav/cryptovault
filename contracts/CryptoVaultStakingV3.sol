// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ✅ AJOUTÉ - Interface pour communiquer avec votre contrat NFT
interface ICryptocaVaultNFT {
    function getUserMultiplier(address user) external view returns (uint256);
    function getUserHighestTier(address user) external view returns (uint256);
    function ownerHasTier(address user, uint256 tier) external view returns (bool);
    function getTierAccessPlans(uint256 tier) external view returns (string[] memory);
}

contract CryptoVaultStakingV3 is Ownable, Pausable, ReentrancyGuard {
    // ✅ AJOUTÉ - Référence vers votre contrat NFT
    ICryptocaVaultNFT public nftContract;
    
    // Structures (INCHANGÉES + AJOUT multiplicateur NFT)
    struct Plan {
        uint256 apr;
        uint256 duration;
        uint256 minAmount;
        bool active;
        uint256 requiredNFTTier; // ✅ AJOUTÉ - Tier NFT requis pour accéder au plan (0 = pas d'exigence)
    }

    struct Stake {
        uint256 planId;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastRewardTime;
        address token;
        bool active;
        uint256 nftMultiplierAtStake; // ✅ AJOUTÉ - Multiplicateur NFT au moment du stake
    }

    // Variables d'état (INCHANGÉES)
    address public feeCollector;
    bool public emergencyMode;
    uint256 public constant PLATFORM_FEE = 200; // 2%
    uint256 public constant BASIS_POINTS = 10000;

    // Mappings (INCHANGÉS)
    mapping(uint256 => Plan) public plans;
    mapping(address => mapping(uint256 => Stake)) public userStakes;
    mapping(address => uint256[]) private userStakeIds;
    mapping(address => bool) public allowedTokens;

    // Nouvelles variables pour les statistiques (INCHANGÉES)
    address[] private userAddresses;
    mapping(address => bool) private isUserRegistered;
    uint256 public totalInvestedAmount;
    uint256 public totalPlatformFees;

    // Events (INCHANGÉS + AJOUTS NFT)
    event PlanCreated(uint256 planId, uint256 apr, uint256 duration, uint256 minAmount);
    event Staked(address indexed user, uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, address token);
    event RewardsClaimed(address indexed user, uint256 stakeId, uint256 amount, address token);
    event StakeEnded(address indexed user, uint256 stakeId, uint256 amount, address token);
    event EmergencyWithdrawn(address indexed user, uint256 stakeId, uint256 amount, uint256 fee, address token);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event EmergencyModeEnabled(address indexed account);
    event TokenAllowanceUpdated(address indexed token, bool allowed);
    event AdminWithdrewUserStake(address indexed user, uint256 stakeId, uint256 amount, address token);
    event AdminWithdraw(address indexed token, uint256 amount, address indexed recipient);
    event AdminWithdrawAll(address indexed token, uint256 amount, address indexed recipient);
    
    // Nouveaux événements pour les mises à jour des plans (INCHANGÉS)
    event PlanAPRUpdated(uint256 indexed planId, uint256 oldAPR, uint256 newAPR);
    event PlanDurationUpdated(uint256 indexed planId, uint256 oldDuration, uint256 newDuration);
    event PlanMinAmountUpdated(uint256 indexed planId, uint256 oldMinAmount, uint256 newMinAmount);
    event PlanUpdated(
        uint256 indexed planId,
        uint256 oldAPR,
        uint256 newAPR,
        uint256 oldDuration,
        uint256 newDuration,
        uint256 oldMinAmount,
        uint256 newMinAmount
    );

    // ✅ AJOUTÉ - Nouveaux événements NFT
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event PlanRequirementUpdated(uint256 indexed planId, uint256 requiredTier);
    event StakedWithNFTBonus(address indexed user, uint256 planId, uint256 amount, uint256 nftMultiplier);

    uint256 private planCounter = 0;

    // ✅ MODIFIÉ - Constructor avec contrat NFT optionnel
    constructor(address _feeCollector, address _nftContract) {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
        
        // NFT contract peut être address(0) au début, configurable plus tard
        if (_nftContract != address(0)) {
            nftContract = ICryptocaVaultNFT(_nftContract);
        }
    }

    // ✅ AJOUTÉ - Fonction pour configurer le contrat NFT
    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        emit NFTContractUpdated(address(nftContract), _nftContract);
        nftContract = ICryptocaVaultNFT(_nftContract);
    }

    // Fonctions administratives (TOUTES INCHANGÉES)
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        emit FeeCollectorUpdated(feeCollector, _feeCollector);
        feeCollector = _feeCollector;
    }

    function setAllowedToken(address _token, bool _allowed) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        allowedTokens[_token] = _allowed;
        emit TokenAllowanceUpdated(_token, _allowed);
    }

    // ✅ MODIFIÉ - createPlan avec paramètre NFT optionnel
    function createPlan(uint256 _apr, uint256 _duration, uint256 _minAmount) external onlyOwner {
        uint256 planId = planCounter++;
        plans[planId] = Plan({
            apr: _apr,
            duration: _duration,
            minAmount: _minAmount,
            active: true,
            requiredNFTTier: 0 // ✅ AJOUTÉ - Par défaut, pas d'exigence NFT
        });
        emit PlanCreated(planId, _apr, _duration, _minAmount);
    }

    // ✅ AJOUTÉ - Nouvelle fonction pour créer un plan avec exigence NFT
    function createPlanWithNFTRequirement(
        uint256 _apr, 
        uint256 _duration, 
        uint256 _minAmount,
        uint256 _requiredNFTTier
    ) external onlyOwner {
        uint256 planId = planCounter++;
        plans[planId] = Plan({
            apr: _apr,
            duration: _duration,
            minAmount: _minAmount,
            active: true,
            requiredNFTTier: _requiredNFTTier
        });
        emit PlanCreated(planId, _apr, _duration, _minAmount);
    }

    // ✅ AJOUTÉ - Fonction pour modifier les exigences NFT d'un plan existant
    function updatePlanNFTRequirement(uint256 _planId, uint256 _requiredNFTTier) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        plans[_planId].requiredNFTTier = _requiredNFTTier;
        emit PlanRequirementUpdated(_planId, _requiredNFTTier);
    }

    function togglePlan(uint256 _planId) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        plans[_planId].active = !plans[_planId].active;
    }

    // Nouvelles fonctions de mise à jour des paramètres des plans (TOUTES INCHANGÉES)
    function updatePlanAPR(uint256 _planId, uint256 _newAPR) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        require(_newAPR > 0, "APR must be greater than 0");
        
        uint256 oldAPR = plans[_planId].apr;
        plans[_planId].apr = _newAPR;
        
        emit PlanAPRUpdated(_planId, oldAPR, _newAPR);
    }

    function updatePlanDuration(uint256 _planId, uint256 _newDuration) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        require(_newDuration > 0, "Duration must be greater than 0");
        
        uint256 oldDuration = plans[_planId].duration;
        plans[_planId].duration = _newDuration;
        
        emit PlanDurationUpdated(_planId, oldDuration, _newDuration);
    }

    function updatePlanMinAmount(uint256 _planId, uint256 _newMinAmount) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        require(_newMinAmount > 0, "Minimum amount must be greater than 0");
        
        uint256 oldMinAmount = plans[_planId].minAmount;
        plans[_planId].minAmount = _newMinAmount;
        
        emit PlanMinAmountUpdated(_planId, oldMinAmount, _newMinAmount);
    }

    // Fonction pour mettre à jour plusieurs paramètres en une seule transaction (INCHANGÉE)
    function updatePlan(
        uint256 _planId,
        uint256 _newAPR,
        uint256 _newDuration,
        uint256 _newMinAmount
    ) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        require(_newAPR > 0, "APR must be greater than 0");
        require(_newDuration > 0, "Duration must be greater than 0");
        require(_newMinAmount > 0, "Minimum amount must be greater than 0");
        
        Plan storage plan = plans[_planId];
        
        uint256 oldAPR = plan.apr;
        uint256 oldDuration = plan.duration;
        uint256 oldMinAmount = plan.minAmount;
        
        plan.apr = _newAPR;
        plan.duration = _newDuration;
        plan.minAmount = _newMinAmount;
        
        emit PlanUpdated(_planId, oldAPR, _newAPR, oldDuration, _newDuration, oldMinAmount, _newMinAmount);
    }

    function enableEmergencyMode() external onlyOwner {
        emergencyMode = true;
        emit EmergencyModeEnabled(msg.sender);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ✅ AJOUTÉ - Fonction pour vérifier l'accès d'un utilisateur à un plan
    function canUserAccessPlan(address user, uint256 planId) public view returns (bool) {
        if (!plans[planId].active) return false;
        
        uint256 requiredTier = plans[planId].requiredNFTTier;
        if (requiredTier == 0) return true; // Pas d'exigence NFT
        
        // Si pas de contrat NFT configuré, autoriser l'accès
        if (address(nftContract) == address(0)) return true;
        
        uint256 userHighestTier = nftContract.getUserHighestTier(user);
        return userHighestTier >= requiredTier;
    }

    // ✅ AJOUTÉ - Fonction pour obtenir le multiplicateur NFT d'un utilisateur
    function getUserNFTMultiplier(address user) public view returns (uint256) {
        if (address(nftContract) == address(0)) {
            return BASIS_POINTS; // 1.0x si pas de contrat NFT
        }
        
        try nftContract.getUserMultiplier(user) returns (uint256 multiplier) {
            // Convertir de 100-based (votre contrat) vers 10000-based (basis points)
            if (multiplier < 1000) {
                return multiplier * 100; // 120 -> 12000 (1.2x en basis points)
            }
            return multiplier;
        } catch {
            return BASIS_POINTS; // 1.0x en cas d'erreur
        }
    }

    // ✅ MODIFIÉ - Fonction stake avec support NFT
    function stake(uint256 _planId, uint256 _amount, address _token) external whenNotPaused nonReentrant {
        require(!emergencyMode, "Emergency mode active");
        require(plans[_planId].active, "Plan not active");
        require(_amount >= plans[_planId].minAmount, "Amount below minimum");
        require(_token != address(0), "Invalid token address");
        require(allowedTokens[_token], "Token not allowed");

        // ✅ AJOUTÉ - Vérifier l'accès NFT
        require(canUserAccessPlan(msg.sender, _planId), "NFT tier insufficient for this plan");

        // ✅ AJOUTÉ - Obtenir le multiplicateur NFT actuel
        uint256 nftMultiplier = getUserNFTMultiplier(msg.sender);

        // Ajout du tracking des utilisateurs et des montants (INCHANGÉ)
        if (!isUserRegistered[msg.sender]) {
            userAddresses.push(msg.sender);
            isUserRegistered[msg.sender] = true;
        }

        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        uint256 platformFee = (_amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 amountAfterFee = _amount - platformFee;
   
        // Transférer les frais au collecteur de frais (INCHANGÉ)
        require(token.transfer(feeCollector, platformFee), "Fee transfer failed");

        totalInvestedAmount += amountAfterFee;
        totalPlatformFees += platformFee;

        uint256 stakeId = userStakeIds[msg.sender].length;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (plans[_planId].duration * 1 days);

        // ✅ MODIFIÉ - Inclure le multiplicateur NFT dans le stake
        userStakes[msg.sender][stakeId] = Stake({
            planId: _planId,
            amount: amountAfterFee,
            startTime: startTime,
            endTime: endTime,
            lastRewardTime: startTime,
            token: _token,
            active: true,
            nftMultiplierAtStake: nftMultiplier // ✅ AJOUTÉ
        });

        userStakeIds[msg.sender].push(stakeId);

        emit Staked(msg.sender, _planId, amountAfterFee, startTime, endTime, _token);
        
        // ✅ AJOUTÉ - Événement spécifique pour les stakes avec bonus NFT
        if (nftMultiplier > BASIS_POINTS) {
            emit StakedWithNFTBonus(msg.sender, _planId, amountAfterFee, nftMultiplier);
        }
    }

    // ✅ MODIFIÉ - FONCTION calculateRewards avec support NFT
    function calculateRewards(address _user, uint256 _stakeId) public view returns (uint256) {
        Stake storage userStake = userStakes[_user][_stakeId];
        if (!userStake.active) return 0;

        uint256 currentTime = block.timestamp;
        // Limiter le calcul à la fin du plan pour éviter les rewards post-expiration (INCHANGÉ)
        if (currentTime > userStake.endTime) {
            currentTime = userStake.endTime;
        }
        
        uint256 timeElapsed = currentTime - userStake.lastRewardTime;
        uint256 apr = plans[userStake.planId].apr;
        
        // Calcul de base (INCHANGÉ)
        uint256 baseRewards = (userStake.amount * apr * timeElapsed) / (365 days * BASIS_POINTS);
        
        // ✅ AJOUTÉ - Application du multiplicateur NFT
        uint256 rewardsWithBonus = (baseRewards * userStake.nftMultiplierAtStake) / BASIS_POINTS;
        
        return rewardsWithBonus;
    }

    // ✅ AJOUTÉ - Fonction pour obtenir les récompenses de base (sans bonus NFT)
    function calculateBaseRewards(address _user, uint256 _stakeId) public view returns (uint256) {
        Stake storage userStake = userStakes[_user][_stakeId];
        if (!userStake.active) return 0;

        uint256 currentTime = block.timestamp;
        if (currentTime > userStake.endTime) {
            currentTime = userStake.endTime;
        }
        
        uint256 timeElapsed = currentTime - userStake.lastRewardTime;
        uint256 apr = plans[userStake.planId].apr;
    
        return (userStake.amount * apr * timeElapsed) / (365 days * BASIS_POINTS);
    }

    // ✅ AJOUTÉ - Fonction pour obtenir les détails complets d'un stake
    function getStakeDetails(address _user, uint256 _stakeId) public view returns (
        uint256 baseRewards,
        uint256 bonusRewards,
        uint256 totalRewards,
        uint256 nftMultiplier,
        uint256 currentUserMultiplier
    ) {
        Stake storage userStake = userStakes[_user][_stakeId];
        
        baseRewards = calculateBaseRewards(_user, _stakeId);
        nftMultiplier = userStake.nftMultiplierAtStake;
        totalRewards = calculateRewards(_user, _stakeId);
        bonusRewards = totalRewards - baseRewards;
        currentUserMultiplier = getUserNFTMultiplier(_user);
        
        return (baseRewards, bonusRewards, totalRewards, nftMultiplier, currentUserMultiplier);
    }

    // ✅ AJOUTÉ - Fonction pour obtenir les plans accessibles par un utilisateur
    function getAccessiblePlans(address _user) external view returns (uint256[] memory) {
        uint256[] memory accessible = new uint256[](planCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < planCounter; i++) {
            if (canUserAccessPlan(_user, i)) {
                accessible[count] = i;
                count++;
            }
        }
        
        // Redimensionner le tableau
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = accessible[i];
        }
        
        return result;
    }

    // ✅ AJOUTÉ - Fonction pour obtenir les informations NFT d'un utilisateur
    function getUserNFTInfo(address _user) external view returns (
        uint256 highestTier,
        uint256 multiplier,
        uint256[] memory accessiblePlans
    ) {
        if (address(nftContract) == address(0)) {
            // Retourner des valeurs par défaut si pas de contrat NFT
            uint256[] memory defaultPlans = new uint256[](0);
            return (0, BASIS_POINTS, defaultPlans);
        }
        
        try nftContract.getUserHighestTier(_user) returns (uint256 tier) {
            highestTier = tier;
        } catch {
            highestTier = 0;
        }
        
        multiplier = getUserNFTMultiplier(_user);
        accessiblePlans = this.getAccessiblePlans(_user);
        
        return (highestTier, multiplier, accessiblePlans);
    }

    // Toutes les fonctions suivantes restent EXACTEMENT INCHANGÉES
    function claimRewards(uint256 _stakeId) external nonReentrant {
        require(!emergencyMode, "Emergency mode active");
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");

        uint256 rewards = calculateRewards(msg.sender, _stakeId);
        require(rewards > 0, "No rewards to claim");

        // Mise à jour du lastRewardTime en tenant compte de la limite endTime
        uint256 currentTime = block.timestamp;
        if (currentTime > userStake.endTime) {
            currentTime = userStake.endTime;
        }
        userStake.lastRewardTime = currentTime;
        
        IERC20 token = IERC20(userStake.token);
        require(token.transfer(msg.sender, rewards), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, _stakeId, rewards, userStake.token);
    }

    function endStake(uint256 _stakeId) external nonReentrant {
        require(!emergencyMode, "Emergency mode active");
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");
        require(block.timestamp >= userStake.endTime, "Stake period not ended");

        uint256 rewards = calculateRewards(msg.sender, _stakeId);
        uint256 totalAmount = userStake.amount + rewards;
        
        userStake.active = false;
        
        IERC20 token = IERC20(userStake.token);
        require(token.transfer(msg.sender, totalAmount), "Transfer failed");
        
        emit StakeEnded(msg.sender, _stakeId, totalAmount, userStake.token);
    }

    function emergencyWithdraw(uint256 _stakeId) external nonReentrant {
        require(emergencyMode, "Emergency mode not active");
        
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");
        
        uint256 fee = (userStake.amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 withdrawAmount = userStake.amount - fee;
        
        userStake.active = false;
        
        IERC20 token = IERC20(userStake.token);
        
        // Transférer les frais au collecteur
        if (fee > 0) {
            require(token.transfer(feeCollector, fee), "Fee transfer failed");
        }
        
        // Transférer le montant restant à l'utilisateur
        require(token.transfer(msg.sender, withdrawAmount), "Withdrawal transfer failed");
        
        emit EmergencyWithdrawn(msg.sender, _stakeId, withdrawAmount, fee, userStake.token);
    }

    function adminWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(_amount <= balance, "Insufficient contract balance");
    
        require(token.transfer(msg.sender, _amount), "Transfer failed");

        emit AdminWithdraw(_token, _amount, msg.sender);
    }

    // Pour retirer tous les fonds d'un token
    function adminWithdrawAll(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
    
        require(token.transfer(msg.sender, balance), "Transfer failed");

        emit AdminWithdrawAll(_token, balance, msg.sender);
    }

    function adminWithdrawUserStake(address _user, uint256 _stakeId) external onlyOwner {
        Stake storage userStake = userStakes[_user][_stakeId];
        require(userStake.active, "Stake not active");

        uint256 totalAmount = userStake.amount;
        IERC20 token = IERC20(userStake.token);

        // Désactiver le stake
        userStake.active = false;

        // Transférer le montant total au propriétaire du contrat
        require(token.transfer(msg.sender, totalAmount), "Transfer failed");

        emit AdminWithdrewUserStake(_user, _stakeId, totalAmount, userStake.token);
    }

    // ✅ MODIFIÉ - Fonctions de vue avec support NFT
    function getUserStakes(address _user) external view returns (Stake[] memory) {
        uint256[] memory stakeIds = userStakeIds[_user];
        Stake[] memory stakes = new Stake[](stakeIds.length);
        
        for (uint256 i = 0; i < stakeIds.length; i++) {
            stakes[i] = userStakes[_user][stakeIds[i]];
        }
        
        return stakes;
    }

    // ✅ MODIFIÉ - Fonction getPlan avec support NFT
    function getPlan(uint256 _planId) external view returns (
        uint256 apr,
        uint256 duration,
        uint256 minAmount,
        bool active,
        uint256 requiredNFTTier
    ) {
        require(_planId < planCounter, "Invalid plan ID");
        Plan storage plan = plans[_planId];
        return (plan.apr, plan.duration, plan.minAmount, plan.active, plan.requiredNFTTier);
    }

    // Fonction pour obtenir le nombre total de plans créés (INCHANGÉE)
    function getTotalPlans() external view returns (uint256) {
        return planCounter;
    }

    // Fonctions pour les statistiques de la plateforme (TOUTES INCHANGÉES)
    function getUserCount() external view returns (uint256) {
        return userAddresses.length;
    }

    function getTotalInvested() external view returns (uint256) {
        return totalInvestedAmount;
    }

    function getTotalFees() external view returns (uint256) {
        return totalPlatformFees;
    }

    function getPlatformProfit() external view returns (uint256) {
        return totalPlatformFees;
    }
}