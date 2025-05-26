// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPancakeRouter02.sol";

contract CryptoVaultStaking is ReentrancyGuard, Ownable {
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
        bool active;
    }

    IERC20 public immutable stakingToken;
    IPancakeRouter02 public immutable pancakeRouter;
    address public immutable WBNB;
    
    uint256 public constant PLATFORM_FEE = 200; // 2% fee (basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_WITHDRAWAL = 1e18; // 1 token minimum withdrawal
    uint256 public constant EMERGENCY_WITHDRAW_FEE = 1000; // 10% fee for emergency withdrawals

    bool public paused;
    bool public emergencyMode;
    
    mapping(uint256 => Plan) public plans;
    mapping(address => Stake[]) public userStakes;
    
    event PlanCreated(uint256 planId, uint256 apr, uint256 duration, uint256 minAmount);
    event Staked(address indexed user, uint256 planId, uint256 amount, uint256 startTime, uint256 endTime);
    event RewardsClaimed(address indexed user, uint256 stakeId, uint256 amount);
    event StakeEnded(address indexed user, uint256 stakeId, uint256 amount);
    event EmergencyWithdrawn(address indexed user, uint256 stakeId, uint256 amount, uint256 fee);
    event PlatformEmergencyWithdrawn(address indexed token, uint256 amount);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event EmergencyModeEnabled(address indexed account);
    event LiquidityAdded(uint256 tokenAmount, uint256 bnbAmount, uint256 liquidity);
    event LiquidityRemoved(uint256 tokenAmount, uint256 bnbAmount, uint256 liquidity);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract not paused");
        _;
    }

    constructor(
        address _stakingToken,
        address _pancakeRouter
    ) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        pancakeRouter = IPancakeRouter02(_pancakeRouter);
        WBNB = pancakeRouter.WETH();
        paused = false;
        emergencyMode = false;
    }

    function pause() external onlyOwner {
        require(!paused, "Contract already paused");
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        require(paused, "Contract not paused");
        require(!emergencyMode, "Emergency mode active");
        paused = false;
        emit Unpaused(msg.sender);
    }

    function enableEmergencyMode() external onlyOwner {
        require(!emergencyMode, "Emergency mode already active");
        emergencyMode = true;
        paused = true;
        emit EmergencyModeEnabled(msg.sender);
    }

    function createPlan(
        uint256 _planId,
        uint256 _apr,
        uint256 _duration,
        uint256 _minAmount
    ) external onlyOwner whenNotPaused {
        require(_apr > 0, "Invalid APR");
        require(_duration > 0, "Invalid duration");
        require(_minAmount > 0, "Invalid minimum amount");
        
        plans[_planId] = Plan({
            apr: _apr,
            duration: _duration,
            minAmount: _minAmount,
            active: true
        });
        
        emit PlanCreated(_planId, _apr, _duration, _minAmount);
    }

    function stake(uint256 _planId, uint256 _amount) external nonReentrant whenNotPaused {
        Plan storage plan = plans[_planId];
        require(plan.active, "Plan not active");
        require(_amount >= plan.minAmount, "Amount below minimum");
        
        uint256 fee = (_amount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 stakeAmount = _amount - fee;
        
        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        require(stakingToken.transfer(owner(), fee), "Fee transfer failed");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (plan.duration * 1 days);
        
        userStakes[msg.sender].push(Stake({
            planId: _planId,
            amount: stakeAmount,
            startTime: startTime,
            endTime: endTime,
            lastRewardTime: startTime,
            active: true
        }));
        
        emit Staked(msg.sender, _planId, stakeAmount, startTime, endTime);
    }

    function calculateRewards(address _user, uint256 _stakeId) public view returns (uint256) {
        require(_stakeId < userStakes[_user].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[_user][_stakeId];
        if (!userStake.active) return 0;
        
        Plan storage plan = plans[userStake.planId];
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        
        uint256 dailyRate = (plan.apr * BASIS_POINTS) / (365 * 100);
        uint256 rewards = (userStake.amount * dailyRate * timeElapsed) / (BASIS_POINTS * 1 days);
        
        return rewards;
    }

    function claimRewards(uint256 _stakeId) external nonReentrant whenNotPaused {
        require(_stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");
        
        uint256 rewards = calculateRewards(msg.sender, _stakeId);
        require(rewards >= MIN_WITHDRAWAL, "Rewards below minimum");
        
        userStake.lastRewardTime = block.timestamp;
        
        require(stakingToken.transfer(msg.sender, rewards), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, _stakeId, rewards);
    }

    function endStake(uint256 _stakeId) external nonReentrant whenNotPaused {
        require(_stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");
        require(block.timestamp >= userStake.endTime, "Stake still locked");
        
        uint256 rewards = calculateRewards(msg.sender, _stakeId);
        uint256 totalAmount = userStake.amount + rewards;
        
        userStake.active = false;
        
        require(stakingToken.transfer(msg.sender, totalAmount), "Transfer failed");
        
        emit StakeEnded(msg.sender, _stakeId, totalAmount);
    }

    function emergencyWithdraw(uint256 _stakeId) external nonReentrant {
        require(paused || emergencyMode, "Contract must be paused or in emergency mode");
        require(_stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage userStake = userStakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");
        
        uint256 amount = userStake.amount;
        uint256 fee = (amount * EMERGENCY_WITHDRAW_FEE) / BASIS_POINTS;
        uint256 withdrawAmount = amount - fee;
        
        userStake.active = false;
        
        require(stakingToken.transfer(owner(), fee), "Fee transfer failed");
        require(stakingToken.transfer(msg.sender, withdrawAmount), "Withdrawal failed");
        
        emit EmergencyWithdrawn(msg.sender, _stakeId, withdrawAmount, fee);
    }

    function platformEmergencyWithdraw(address _token) external onlyOwner {
        require(emergencyMode, "Emergency mode not active");
        
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        require(token.transfer(owner(), balance), "Withdrawal failed");
        
        emit PlatformEmergencyWithdrawn(_token, balance);
    }

    function getUserStakes(address _user) external view returns (Stake[] memory) {
        return userStakes[_user];
    }

    function addLiquidity(
        uint256 tokenAmount,
        uint256 bnbAmount
    ) external payable onlyOwner {
        require(msg.value == bnbAmount, "Incorrect BNB amount sent");
        require(stakingToken.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance");
        
        stakingToken.approve(address(pancakeRouter), tokenAmount);
        
        (uint256 amountToken, uint256 amountBNB, uint256 liquidity) = pancakeRouter.addLiquidityETH{value: bnbAmount}(
            address(stakingToken),
            tokenAmount,
            0, // Accept any amount of tokens
            0, // Accept any amount of BNB
            address(this),
            block.timestamp + 15 minutes
        );
        
        emit LiquidityAdded(amountToken, amountBNB, liquidity);
    }
    
    function removeLiquidity(
        uint256 liquidity,
        address lpToken
    ) external onlyOwner {
        IERC20(lpToken).approve(address(pancakeRouter), liquidity);
        
        (uint256 amountToken, uint256 amountBNB) = pancakeRouter.removeLiquidityETH(
            address(stakingToken),
            liquidity,
            0, // Accept any amount of tokens
            0, // Accept any amount of BNB
            address(this),
            block.timestamp + 15 minutes
        );
        
        emit LiquidityRemoved(amountToken, amountBNB, liquidity);
    }

    receive() external payable {}
}