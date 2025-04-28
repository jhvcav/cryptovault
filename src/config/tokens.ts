import { ethers } from 'ethers';

interface TokenConfig {
  address: string;
  decimals: number;
  symbol: string;
  abi: string[];
}

export const TOKENS: { [key: string]: TokenConfig } = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955', // BSC Mainnet USDT
    decimals: 18,
    symbol: 'USDT',
    abi: [
      'function balanceOf(address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)',
      'function allowance(address, address) view returns (uint256)',
      'function transfer(address, uint256) returns (bool)',
      'function transferFrom(address, address, uint256) returns (bool)'
    ]
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC Mainnet USDC
    decimals: 18,
    symbol: 'USDC',
    abi: [
      'function balanceOf(address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)',
      'function allowance(address, address) view returns (uint256)',
      'function transfer(address, uint256) returns (bool)',
      'function transferFrom(address, address, uint256) returns (bool)'
    ]
  }
};

export const getTokenContract = (
  tokenAddress: string,
  provider: ethers.Provider
) => {
  return new ethers.Contract(
    tokenAddress,
    [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)'
    ],
    provider
  );
};