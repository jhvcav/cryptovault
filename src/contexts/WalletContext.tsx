import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useContracts } from '../hooks/useContracts';

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
}

interface WalletProviderProps {
  children: ReactNode;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState({ usdt: 0, usdc: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  
  const { getTokenBalance } = useContracts();

  const updateBalances = async (userAddress: string) => {
    try {
      if (!userAddress) return;
      
      const [usdtBalance, usdcBalance] = await Promise.all([
        getTokenBalance('USDT', userAddress),
        getTokenBalance('USDC', userAddress)
      ]);

      setBalance({
        usdt: parseFloat(usdtBalance),
        usdc: parseFloat(usdcBalance)
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des soldes:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Veuillez installer MetaMask pour utiliser cette application.');
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
        await updateBalances(userAddress);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Échec de la connexion au portefeuille.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance({ usdt: 0, usdc: 0 });
    setIsConnected(false);
    localStorage.removeItem('walletConnected');
  };

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
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: 'BSC Mainnet',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }
            ]
          });
        } catch (addError) {
          console.error('Erreur lors de l\'ajout du réseau:', addError);
        }
      }
      console.error('Erreur lors du changement de réseau:', error);
    }
  };

  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    if (wasConnected && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            const userAddress = accounts[0];
            setAddress(userAddress);
            setIsConnected(true);
            updateBalances(userAddress);
          }
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setIsConnected(true);
        await updateBalances(userAddress);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };

    window.ethereum.request({ method: 'eth_chainId' })
      .then((chainId: string) => setChainId(parseInt(chainId, 16)))
      .catch(console.error);

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      updateBalances(address);
      
      const interval = setInterval(() => {
        updateBalances(address);
      }, 10000); // Mettre à jour les soldes toutes les 10 secondes

      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const value = {
    address,
    balance,
    connectWallet,
    disconnectWallet,
    isConnecting,
    isConnected,
    chainId,
    switchNetwork
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet doit être utilisé à l\'intérieur d\'un WalletProvider');
  }
  return context;
};