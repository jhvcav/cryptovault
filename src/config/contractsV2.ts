import { ethers } from 'ethers';

export const CONTRACTSV2 = {
  STAKING: {
    address: '0xcF76Fb0D057228BC84772cA654E17ab580725388', // Adresse du contrat de stakingV3
    abi: [
      // Fonctions de lecture
      "function owner() external view returns (address)",
      "function paused() external view returns (bool)",
      "function emergencyMode() external view returns (bool)",
      "function PLATFORM_FEE() external view returns (uint256)",
      "function BASIS_POINTS() external view returns (uint256)",
      "function feeCollector() external view returns (address)",
      "function allowedTokens(address) external view returns (bool)",
      "function plans(uint256) external view returns (uint256 apr, uint256 duration, uint256 minAmount, bool active)",
      "function userStakes(address, uint256) external view returns (uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active)",
      "function getUserStakes(address _user) external view returns (tuple(uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active)[])",
      "function getUserCount() external view returns (uint256)",
      "function getTotalInvested() external view returns (uint256)",
      "function getTotalFees() external view returns (uint256)",
      "function getPlatformProfit() external view returns (uint256)",
      "function calculateRewards(address _user, uint256 _stakeId) external view returns (uint256)",

      // Fonctions d'écriture
      "function setFeeCollector(address _feeCollector) external",
      "function setAllowedToken(address _token, bool _allowed) external",
      "function createPlan(uint256 _apr, uint256 _duration, uint256 _minAmount) external",
      "function togglePlan(uint256 _planId) external",
      "function enableEmergencyMode() external",
      "function pause() external",
      "function unpause() external",
      "function stake(uint256 _planId, uint256 _amount, address _token) external",
      "function claimRewards(uint256 _stakeId) external",
      "function endStake(uint256 _stakeId) external",
      "function emergencyWithdraw(uint256 _stakeId) external",
      "function adminWithdraw(address _token, uint256 _amount) external",
      "function adminWithdrawAll(address _token) external",
      "function adminWithdrawUserStake(address _user, uint256 _stakeId) external",

      // Events
      "event PlanCreated(uint256 planId, uint256 apr, uint256 duration, uint256 minAmount)",
      "event Staked(address indexed user, uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, address token)",
      "event RewardsClaimed(address indexed user, uint256 stakeId, uint256 amount, address token)",
      "event StakeEnded(address indexed user, uint256 stakeId, uint256 amount, address token)",
      "event EmergencyWithdrawn(address indexed user, uint256 stakeId, uint256 amount, uint256 fee, address token)",
      "event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector)",
      "event EmergencyModeEnabled(address indexed account)",
      "event TokenAllowanceUpdated(address indexed token, bool allowed)",
      "event AdminWithdrewUserStake(address indexed user, uint256 stakeId, uint256 amount, address token)",
      "event AdminWithdraw(address indexed token, uint256 amount, address indexed recipient)",
      "event AdminWithdrawAll(address indexed token, uint256 amount, address indexed recipient)"
    ]
  }
};

export const getContract = (
  contractConfig: typeof CONTRACTSV2.STAKING,
  provider: ethers.Provider
) => {
  return new ethers.Contract(
    contractConfig.address,
    contractConfig.abi,
    provider
  );
};