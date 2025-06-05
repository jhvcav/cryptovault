// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICryptoVaultStaking {
    function adminWithdraw(address _token, uint256 _amount) external;
    function adminWithdrawAll(address _token) external;
}