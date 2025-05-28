import { ethers } from 'ethers';

interface TokenConfig {
  address: string;
  decimals: number;
  symbol: string;
  abi: string[];
}

export const TOKENS: { [key: string]: TokenConfig } = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 6,
    symbol: 'USDT',
    abi: [
      'function balanceOf(address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)',
      'function allowance(address, address) view returns (uint256)',
      'function transfer(address, uint256) returns (bool)',
      'function transferFrom(address, address, uint256) returns (bool)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ]
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 6,
    symbol: 'USDC',
    abi: [
      'function balanceOf(address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)',
      'function allowance(address, address) view returns (uint256)',
      'function transfer(address, uint256) returns (bool)',
      'function transferFrom(address, address, uint256) returns (bool)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ]
  }
};

export const getTokenContract = (
  tokenAddress: string,
  provider: ethers.Provider
): ethers.Contract => {
  const tokenABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address, uint256) returns (bool)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)',
    'function transferFrom(address, address, uint256) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ];

  return new ethers.Contract(tokenAddress, tokenABI, provider);
};

export const formatTokenAmount = (amount: ethers.BigNumberish, decimals: number): string => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount: string, decimals: number): ethers.BigNumber => {
  return ethers.parseUnits(amount, decimals);
};