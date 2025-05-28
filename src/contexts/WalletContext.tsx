import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContracts } from '../hooks/useContracts';

// Adresses des tokens (ajustez-les selon vos besoins)
const TOKEN_ADDRESSES = {
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
};

// ABI simplifié pour les tokens ERC20
const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

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
  
  // Utilisation du provider de useContracts
  const { provider } = useContracts();

  // Fonction pour récupérer le solde d'un token
  const getTokenBalance = async (tokenSymbol: string, userAddress: string) => {
    if (!provider || !userAddress) return "0";
    
    try {
      const tokenAddress = tokenSymbol === 'USDT' 
        ? TOKEN_ADDRESSES.USDT 
        : TOKEN_ADDRESSES.USDC;
      
      // Créer un contrat pour le token
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      
      // Récupérer la balance et les décimales
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.decimals()
      ]);
      
      // Formater la balance
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`Erreur lors de la récupération du solde ${tokenSymbol}:`, error);
      return "0";
    }
  };

  // Utiliser useCallback pour updateBalances pour éviter les recréations de fonction
  const updateBalances = useCallback(async (userAddress: string) => {
    try {
      if (!userAddress || !provider) return;
      
      console.log("Mise à jour des soldes pour l'adresse:", userAddress);
      
      const [usdtBalance, usdcBalance] = await Promise.all([
        getTokenBalance('USDT', userAddress),
        getTokenBalance('USDC', userAddress)
      ]);

      // Convertir les soldes en nombres
      const newUsdt = parseFloat(usdtBalance);
      const newUsdc = parseFloat(usdcBalance);
      
      console.log("Soldes récupérés - USDT:", usdtBalance, "USDC:", usdcBalance);
      
      // Vérifier si les soldes ont changé avant de mettre à jour l'état
      if (newUsdt !== balance.usdt || newUsdc !== balance.usdc) {
        setBalance({
          usdt: newUsdt,
          usdc: newUsdc
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des soldes:', error);
    }
  }, [provider, balance.usdt, balance.usdc, getTokenBalance]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Veuillez installer MetaMask pour utiliser cette application.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await (window.ethereum as any).request({
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
      await (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await (window.ethereum as any).request({
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

  // Effet pour la connexion initiale
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    if (wasConnected && window.ethereum) {
      (window.ethereum as any).request({ method: 'eth_accounts' })
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
  }, [updateBalances]);

  // Définir le type pour ethereum provider  
  // Effet pour gérer les changements de compte et de chaîne
  useEffect(() => {
    // Vérifier si window.ethereum existe
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

    // Utiliser une assertion de type plus agressive
    (window.ethereum as any).request({ method: 'eth_chainId' })
      .then((chainId: string) => setChainId(parseInt(chainId, 16)))
      .catch(console.error);

    // Utiliser une assertion de type plus agressive
    (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
    (window.ethereum as any).on('chainChanged', handleChainChanged);

    return () => {
      // Utiliser une assertion de type plus agressive
      (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
      (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
    };
  }, [updateBalances]);

  // Un seul useEffect pour la mise à jour des soldes
  useEffect(() => {
    let isMounted = true;
    
    // N'exécuter que si connecté avec une adresse
    if (!isConnected || !address) return;
    
    // Mise à jour initiale
    updateBalances(address);
    
    // Puis créer un intervalle pour les mises à jour périodiques
    const interval = setInterval(() => {
      if (isMounted) {
        updateBalances(address);
      }
    }, 30000); // Toutes les 30 secondes
    
    // Nettoyer l'intervalle lors du démontage
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isConnected, address, updateBalances]);

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