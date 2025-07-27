// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICakePool {
    function deposit(uint256 _amount, uint256 _lockDuration) external;
    function withdraw(uint256 _amount) external;
    function withdrawAll() external;
    function harvest() external;
    function emergencyWithdraw() external;
    function unlock() external;
    
    // View functions
    function pendingReward(address _user) external view returns (uint256);
    function isActive() external view returns (bool);
    function getRemainingLockTime(address _user) external view returns (uint256);
    function getLockDuration() external view returns (uint256);
    function calculateUnlockPenalty(address _user) external view returns (uint256);
    function getUserLockStatus(address _user) external view returns (
        bool isLocked,
        uint256 lockedAmount,
        uint256 lockEndTime,
        uint256 lockDuration
    );
}