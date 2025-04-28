import { ethers } from 'ethers';

function getEnvVariable(name: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name] || '';
  }
  else if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || '';
  }
  return '';
}

export const CONTRACTS = {
  STAKING: {
    address: getEnvVariable('VITE_STAKING_CONTRACT_ADDRESS'),
    abi: [
      "function owner() external view returns (address)",
      "function paused() external view returns (bool)",
      "function emergencyMode() external view returns (bool)",
      "function PLATFORM_FEE() external view returns (uint256)",
      "function BASIS_POINTS() external view returns (uint256)",
      "function feeCollector() external view returns (address)",
      "function allowedTokens(address) external view returns (bool)",
      "function plans(uint256) external view returns (uint256 apr, uint256 duration, uint256 minAmount, bool active)",
      "function userStakes(address, uint256) external view returns (uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active)",
      "function stake(uint256 _planId, uint256 _amount, address _token) external",
      "function calculateRewards(address _user, uint256 _stakeId) external view returns (uint256)",
      "function claimRewards(uint256 _stakeId) external",
      "function endStake(uint256 _stakeId) external",
      "function emergencyWithdraw(uint256 _stakeId) external",
      "function getUserStakes(address _user) external view returns (tuple(uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active)[])",
      // Ajout des fonctions manquantes pour les statistiques
      "function getUserCount() external view returns (uint256)",
      "function getTotalInvested() external view returns (uint256)",
      "function getTotalFees() external view returns (uint256)",
      "function getPlatformProfit() external view returns (uint256)",
      // Events
      "event PlanCreated(uint256 planId, uint256 apr, uint256 duration, uint256 minAmount)",
      "event Staked(address indexed user, uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, address token)",
      "event RewardsClaimed(address indexed user, uint256 stakeId, uint256 amount, address token)",
      "event StakeEnded(address indexed user, uint256 stakeId, uint256 amount, address token)",
      "event EmergencyWithdrawn(address indexed user, uint256 stakeId, uint256 amount, uint256 fee, address token)",
      "event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector)",
      "event TokenAllowanceUpdated(address indexed token, bool allowed)",
      "event Paused(address indexed account)",
      "event Unpaused(address indexed account)",
      "event EmergencyModeEnabled(address indexed account)"
    ]
  },
  LP_FARMING: {
    address: getEnvVariable('VITE_FARMING_CONTRACT_ADDRESS'),
    abi: [
      "function owner() external view returns (address)",
      "function deposit(uint256 farmId, uint256 amount) external",
      "function claimRewards(uint256 positionId) external",
      "function closePosition(uint256 positionId) external",
      "function emergencyWithdraw(uint256 positionId) external",
      "function getUserPositions(address user) external view returns (tuple(uint256 farmId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, bool active)[])",
      "function calculateRewards(address user, uint256 positionId) external view returns (uint256)",
      "function paused() external view returns (bool)",
      "function emergencyMode() external view returns (bool)",
      "event PositionOpened(address indexed user, uint256 farmId, uint256 amount, uint256 startTime, uint256 endTime)",
      "event RewardsClaimed(address indexed user, uint256 positionId, uint256 amount)",
      "event PositionClosed(address indexed user, uint256 positionId, uint256 amount)",
      "event EmergencyWithdrawn(address indexed user, uint256 positionId, uint256 amount, uint256 fee)"
    ]
  }
};

export const getContract = (
  contractConfig: typeof CONTRACTS.STAKING | typeof CONTRACTS.LP_FARMING,
  provider: ethers.Provider
) => {
  return new ethers.Contract(
    contractConfig.address,
    contractConfig.abi,
    provider
  );
};
