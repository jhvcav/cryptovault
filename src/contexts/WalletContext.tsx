import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Adresses des tokens BSC
const TOKEN_ADDRESSES = {
  USDT: "0x55d398326f99059fF775485246999027B3197955", // USDT BSC
  USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"  // USDC BSC
};

// ABI ERC20 minimal
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const BSC_CHAIN_ID = 56;

interface WalletContextType {
  address: string | null;
  balance: {
    usdt: number;
    usdc: number;
  };
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  chainId: number | null;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState({ usdt: 0, usdc: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Fonction pour récupérer le solde d'un token
  const getTokenBalance = async (tokenAddress: string, userAddress: string): Promise<number> => {
    try {
      if (!window.ethereum || !userAddress) return 0;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals()
      ]);
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      return parseFloat(formattedBalance);
    } catch (error) {
      console.error('Erreur récupération solde token:', error);
      return 0;
    }
  };

  // Fonction pour mettre à jour tous les soldes
  const updateBalances = useCallback(async (userAddress: string) => {
    try {
      console.log('Mise à jour des soldes pour:', userAddress);
      
      const [usdtBalance, usdcBalance] = await Promise.all([
        getTokenBalance(TOKEN_ADDRESSES.USDT, userAddress),
        getTokenBalance(TOKEN_ADDRESSES.USDC, userAddress)
      ]);

      console.log('Soldes récupérés - USDT:', usdtBalance, 'USDC:', usdcBalance);
      
      setBalance({
        usdt: usdtBalance,
        usdc: usdcBalance
      });
    } catch (error) {
      console.error('Erreur mise à jour soldes:', error);
    }
  }, []);

  // Fonction de connexion
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Veuillez installer MetaMask');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setIsConnected(true);
        localStorage.setItem('walletConnected', 'true');
        
        // Charger les soldes immédiatement
        await updateBalances(userAddress);
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      alert('Erreur de connexion au wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Fonction de déconnexion
  const disconnectWallet = () => {
    setAddress(null);
    setBalance({ usdt: 0, usdc: 0 });
    setIsConnected(false);
    setChainId(null);
    localStorage.removeItem('walletConnected');
  };

  // Fonction pour rafraîchir les soldes
  const refreshBalances = useCallback(async () => {
    if (address) {
      await updateBalances(address);
    }
  }, [address, updateBalances]);

  // Fonction pour changer de réseau
  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: 'BSC Mainnet',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            }]
          });
        } catch (addError) {
          console.error('Erreur ajout réseau:', addError);
        }
      }
      console.error('Erreur changement réseau:', error);
    }
  };

  // Effet pour la reconnexion automatique
  useEffect(() => {
    const checkWalletConnection = async () => {
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      
      if (wasConnected && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            await updateBalances(accounts[0]);
          }
        } catch (error) {
          console.error('Erreur reconnexion:', error);
        }
      }
    };

    checkWalletConnection();
  }, [updateBalances]);

  // Effet pour récupérer le chainId initial
  useEffect(() => {
    const getCurrentChainId = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainId, 16));
        } catch (error) {
          console.error('Erreur récupération chainId:', error);
        }
      }
    };

    getCurrentChainId();
  }, []);

  // Effet pour les événements MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await updateBalances(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      
      if (address) {
        await updateBalances(address);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [address, updateBalances]);

  const value = {
    address,
    balance,
    connectWallet,
    disconnectWallet,
    isConnecting,
    isConnected,
    chainId,
    switchNetwork,
    refreshBalances
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet doit être utilisé à l\'intérieur d\'un WalletProvider');
  }
  return context;
};