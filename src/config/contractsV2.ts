//src/config/contractsV2.ts
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
      
      // ✅ CORRIGÉ - Plans avec support NFT
      "function plans(uint256) external view returns (uint256 apr, uint256 duration, uint256 minAmount, bool active, uint256 requiredNFTTier)",
      
      // ✅ CORRIGÉ - UserStakes avec nftMultiplierAtStake
      "function userStakes(address, uint256) external view returns (uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active, uint256 nftMultiplierAtStake)",
      
      // ✅ CORRIGÉ - getUserStakes avec nftMultiplierAtStake
      "function getUserStakes(address _user) external view returns (tuple(uint256 planId, uint256 amount, uint256 startTime, uint256 endTime, uint256 lastRewardTime, address token, bool active, uint256 nftMultiplierAtStake)[])",
      
      "function getUserCount() external view returns (uint256)",
      "function getTotalInvested() external view returns (uint256)",
      "function getTotalFees() external view returns (uint256)",
      "function getPlatformProfit() external view returns (uint256)",
      "function calculateRewards(address _user, uint256 _stakeId) external view returns (uint256)",
      
      // ✅ AJOUTÉ - Nouvelles fonctions NFT
      "function canUserAccessPlan(address user, uint256 planId) external view returns (bool)",
      "function getUserNFTMultiplier(address user) external view returns (uint256)",
      "function getStakeDetails(address _user, uint256 _stakeId) external view returns (uint256 baseRewards, uint256 bonusRewards, uint256 totalRewards, uint256 nftMultiplier, uint256 currentUserMultiplier)",
      "function calculateBaseRewards(address _user, uint256 _stakeId) external view returns (uint256)",
      "function getAccessiblePlans(address _user) external view returns (uint256[])",
      "function getUserNFTInfo(address _user) external view returns (uint256 highestTier, uint256 multiplier, uint256[] accessiblePlans)",
      "function getPlan(uint256 _planId) external view returns (uint256 apr, uint256 duration, uint256 minAmount, bool active, uint256 requiredNFTTier)",
      "function getTotalPlans() external view returns (uint256)",

      // Fonctions d'écriture
      "function setFeeCollector(address _feeCollector) external",
      "function setAllowedToken(address _token, bool _allowed) external",
      "function createPlan(uint256 _apr, uint256 _duration, uint256 _minAmount) external",
      "function createPlanWithNFTRequirement(uint256 _apr, uint256 _duration, uint256 _minAmount, uint256 _requiredNFTTier) external",
      "function updatePlanNFTRequirement(uint256 _planId, uint256 _requiredNFTTier) external",
      "function togglePlan(uint256 _planId) external",
      "function updatePlanAPR(uint256 _planId, uint256 _newAPR) external",
      "function updatePlanDuration(uint256 _planId, uint256 _newDuration) external", 
      "function updatePlanMinAmount(uint256 _planId, uint256 _newMinAmount) external",
      "function updatePlan(uint256 _planId, uint256 _newAPR, uint256 _newDuration, uint256 _newMinAmount) external",
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
      
      // ✅ AJOUTÉ - Fonction NFT contract
      "function setNFTContract(address _nftContract) external",

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
      "event AdminWithdrawAll(address indexed token, uint256 amount, address indexed recipient)",
      
      // ✅ AJOUTÉ - Nouveaux événements NFT
      "event NFTContractUpdated(address indexed oldContract, address indexed newContract)",
      "event PlanRequirementUpdated(uint256 indexed planId, uint256 requiredTier)",
      "event StakedWithNFTBonus(address indexed user, uint256 planId, uint256 amount, uint256 nftMultiplier)",
      "event PlanAPRUpdated(uint256 indexed planId, uint256 oldAPR, uint256 newAPR)",
      "event PlanDurationUpdated(uint256 indexed planId, uint256 oldDuration, uint256 newDuration)",
      "event PlanMinAmountUpdated(uint256 indexed planId, uint256 oldMinAmount, uint256 newMinAmount)",
      "event PlanUpdated(uint256 indexed planId, uint256 oldAPR, uint256 newAPR, uint256 oldDuration, uint256 newDuration, uint256 oldMinAmount, uint256 newMinAmount)"
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