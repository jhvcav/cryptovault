// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CryptoVaultStaking is Ownable, Pausable, ReentrancyGuard {
    // Structures
    struct Plan {
        uint256 apr;
        uint256 duration;
        uint256 minAmount;
        bool active;
    }

    struct Stake {
        uint256 planId;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastRewardTime;
        address token;
        bool active;
    }

    // Variables d'état
    address public feeCollector;
    bool public emergencyMode;
    uint256 public constant PLATFORM_FEE = 200; // 2%
    uint256 public constant BASIS_POINTS = 10000;

    // Mappings
    mapping(uint256 => Plan) public plans;
    mapping(address => mapping(uint256 => Stake)) public userStakes;
    mapping(address => uint256[]) private userStakeIds;
    mapping(address => bool) public allowedTokens;

    // Nouvelles variables pour les statistiques
    address[] private userAddresses;
    mapping(address => bool) private isUserRegistered;
    uint256 public totalInvestedAmount;
    uint256 public totalPlatformFees;

    // Events
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

    uint256 private planCounter = 0;

    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
    }

    // Fonctions administratives
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

    function createPlan(uint256 _apr, uint256 _duration, uint256 _minAmount) external onlyOwner {
        uint256 planId = planCounter++;
        plans[planId] = Plan({
            apr: _apr,
            duration: _duration,
            minAmount: _minAmount,
            active: true
        });
        emit PlanCreated(planId, _apr, _duration, _minAmount);
    }

    function togglePlan(uint256 _planId) external onlyOwner {
        require(_planId < planCounter, "Invalid plan ID");
        plans[_planId].active = !plans[_planId].active;
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

    // Fonctions utilisateur
    function stake(uint256 _planId, uint256 _amount, address _token) external whenNotPaused nonReentrant {
        require(!emergencyMode, "Emergency mode active");
        require(plans[_planId].active, "Plan not active");
        require(_amount >= plans[_planId].minAmount, "Amount below minimum");
        require(_token != address(0), "Invalid token address");
        require(allowedTokens[_token], "Token not allowed");

        // Ajout du tracking des utilisateurs et des montants
        if (!isUserRegistered[msg.sender]) {
            userAddresses.push(msg.sender);
            isUserRegistered[msg.sender] = true;
        }

        IERC20 token = IERC20(_token);
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        uint256 platformFee = (_amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 amountAfterFee = _amount - platformFee;
   
        // Transférer les frais au collecteur de frais
        require(token.transfer(feeCollector, platformFee), "Fee transfer failed");

        totalInvestedAmount += amountAfterFee;
        totalPlatformFees += platformFee;

        uint256 stakeId = userStakeIds[msg.sender].length;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (plans[_planId].duration * 1 days);

        userStakes[msg.sender][stakeId] = Stake({
            planId: _planId,
            amount: amountAfterFee,
            startTime: startTime,
            endTime: endTime,
            lastRewardTime: startTime,
            token: _token,
            active: true
        });

        userStakeIds[msg.sender].push(stakeId);

        emit Staked(msg.sender, _planId, amountAfterFee, startTime, endTime, _token);
    }

    function calculateRewards(address _user, uint256 _stakeId) public view returns (uint256) {
        Stake storage userStake = userStakes[_user][_stakeId];
        if (!userStake.active) return 0;

        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        uint256 apr = plans[userStake.planId].apr;
    
        return (userStake.amount * apr * timeElapsed) / (365 days * BASIS_POINTS);
    }

    function claimRewards(uint256 _stakeId) external nonReentrant {
        require(!emergencyMode, "Emergency mode active");
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");

        uint256 rewards = calculateRewards(msg.sender, _stakeId);
        require(rewards > 0, "No rewards to claim");

        userStake.lastRewardTime = block.timestamp;
        
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

    function getUserStakes(address _user) external view returns (Stake[] memory) {
        uint256[] memory stakeIds = userStakeIds[_user];
        Stake[] memory stakes = new Stake[](stakeIds.length);
        
        for (uint256 i = 0; i < stakeIds.length; i++) {
            stakes[i] = userStakes[_user][stakeIds[i]];
        }
        
        return stakes;
    }

    // Nouvelles fonctions pour les statistiques de la plateforme
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