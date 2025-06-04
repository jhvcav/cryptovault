// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IPancakeRouter02.sol";

contract CryptoVaultLPFarming is Ownable, ReentrancyGuard, Pausable {
    struct Pool {
        address lpToken;
        uint256 apr;
        uint256 totalStaked;
        bool active;
    }

    struct UserStake {
        uint256 amount;
        uint256 lastClaimTime;
    }

    // Platform fee (2%)
    uint256 public constant PLATFORM_FEE = 200;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Emergency withdraw fee (1%)
    uint256 public constant EMERGENCY_WITHDRAW_FEE = 100;

    // Pools
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;

    // User stakes
    mapping(uint256 => mapping(address => UserStake)) public userStakes;

    // Events
    event PoolCreated(uint256 indexed poolId, address lpToken, uint256 apr);
    event PoolUpdated(uint256 indexed poolId, uint256 apr, bool active);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event EmergencyWithdrawn(address indexed user, uint256 indexed poolId, uint256 amount, uint256 fee);

    constructor() Ownable(msg.sender) {}

    // Create new farming pool
    function createPool(address _lpToken, uint256 _apr) external onlyOwner {
        require(_lpToken != address(0), "Invalid LP token");
        require(_apr > 0, "Invalid APR");

        uint256 poolId = poolCount++;
        pools[poolId] = Pool({
            lpToken: _lpToken,
            apr: _apr,
            totalStaked: 0,
            active: true
        });

        emit PoolCreated(poolId, _lpToken, _apr);
    }

    // Update pool parameters
    function updatePool(uint256 _poolId, uint256 _apr, bool _active) external onlyOwner {
        require(_poolId < poolCount, "Invalid pool ID");
        require(_apr > 0, "Invalid APR");

        Pool storage pool = pools[_poolId];
        pool.apr = _apr;
        pool.active = _active;

        emit PoolUpdated(_poolId, _apr, _active);
    }

    // Stake LP tokens
    function stake(uint256 _poolId, uint256 _amount) external nonReentrant whenNotPaused {
        require(_poolId < poolCount, "Invalid pool ID");
        require(_amount > 0, "Invalid amount");

        Pool storage pool = pools[_poolId];
        require(pool.active, "Pool not active");

        // Calculate platform fee
        uint256 fee = (_amount * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 stakeAmount = _amount - fee;

        // Transfer LP tokens
        IERC20 lpToken = IERC20(pool.lpToken);
        require(lpToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        require(lpToken.transfer(owner(), fee), "Fee transfer failed");

        // Update pool and user data
        pool.totalStaked += stakeAmount;
        UserStake storage userStake = userStakes[_poolId][msg.sender];
        
        // Claim any pending rewards before updating stake
        if (userStake.amount > 0) {
            _claimRewards(_poolId);
        }

        userStake.amount += stakeAmount;
        userStake.lastClaimTime = block.timestamp;

        emit Staked(msg.sender, _poolId, stakeAmount);
    }

    // Calculate pending rewards
    function calculateRewards(uint256 _poolId, address _user) public view returns (uint256) {
        Pool storage pool = pools[_poolId];
        UserStake storage userStake = userStakes[_poolId][_user];

        if (userStake.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;
        
        // Daily return = (staked amount * APR) / (365 * 100)
        uint256 dailyReturn = (userStake.amount * pool.apr) / (365 * 100);
        uint256 rewards = (dailyReturn * timeElapsed) / 1 days;

        return rewards;
    }

    // Internal function to claim rewards
    function _claimRewards(uint256 _poolId) internal {
        uint256 rewards = calculateRewards(_poolId, msg.sender);
        if (rewards > 0) {
            UserStake storage userStake = userStakes[_poolId][msg.sender];
            userStake.lastClaimTime = block.timestamp;

            Pool storage pool = pools[_poolId];
            IERC20 lpToken = IERC20(pool.lpToken);
            require(lpToken.transfer(msg.sender, rewards), "Rewards transfer failed");

            emit RewardsClaimed(msg.sender, _poolId, rewards);
        }
    }

    // External function to claim rewards
    function claimRewards(uint256 _poolId) external nonReentrant whenNotPaused {
        require(_poolId < poolCount, "Invalid pool ID");
        require(userStakes[_poolId][msg.sender].amount > 0, "No stake found");

        _claimRewards(_poolId);
    }

    // Unstake LP tokens
    function unstake(uint256 _poolId, uint256 _amount) external nonReentrant {
        require(_poolId < poolCount, "Invalid pool ID");
        
        UserStake storage userStake = userStakes[_poolId][msg.sender];
        require(userStake.amount >= _amount, "Insufficient stake");

        // Claim pending rewards first
        _claimRewards(_poolId);

        // Update pool and user data
        Pool storage pool = pools[_poolId];
        pool.totalStaked -= _amount;
        userStake.amount -= _amount;

        // Transfer LP tokens back to user
        IERC20 lpToken = IERC20(pool.lpToken);
        require(lpToken.transfer(msg.sender, _amount), "Transfer failed");

        emit Unstaked(msg.sender, _poolId, _amount);
    }

    // Emergency withdraw without rewards
    function emergencyWithdraw(uint256 _poolId) external nonReentrant {
        require(_poolId < poolCount, "Invalid pool ID");
        
        UserStake storage userStake = userStakes[_poolId][msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No stake found");

        // Calculate emergency withdrawal fee
        uint256 fee = (amount * EMERGENCY_WITHDRAW_FEE) / FEE_DENOMINATOR;
        uint256 withdrawAmount = amount - fee;

        // Update pool and user data
        Pool storage pool = pools[_poolId];
        pool.totalStaked -= amount;
        userStake.amount = 0;
        userStake.lastClaimTime = block.timestamp;

        // Transfer tokens
        IERC20 lpToken = IERC20(pool.lpToken);
        require(lpToken.transfer(owner(), fee), "Fee transfer failed");
        require(lpToken.transfer(msg.sender, withdrawAmount), "Withdrawal failed");

        emit EmergencyWithdrawn(msg.sender, _poolId, withdrawAmount, fee);
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency token recovery
    function recoverToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }
}