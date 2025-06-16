import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useAuth } from './AuthContext';

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
  checkWalletConnection: () => Promise<void>;
  requestAccountPermissions: () => Promise<void>;  // Nouvelle fonction
  changeAccount: () => Promise<void>;               // Nouvelle fonction
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState({ usdt: 0, usdc: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Contexte d'authentification pour la sécurité
  const { isAuthenticated, logout } = useAuth();
  
  // Référence pour l'adresse autorisée (sécurité)
  const authorizedAddressRef = useRef<string | null>(null);
  const isSecurityInitializedRef = useRef(false);

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

  // Fonction pour forcer la demande de permissions (résout le problème du globe MetaMask)
const requestAccountPermissions = useCallback(async () => {
  if (!window.ethereum) {
    console.error('MetaMask non détecté');
    return;
  }

  try {
    // Cette méthode force MetaMask à reconnaître le site comme connecté
    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
    
    console.log('✅ Permissions MetaMask mises à jour');
  } catch (error) {
    console.error('Erreur demande permissions:', error);
  }
}, []);

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

  // Fonction de vérification de sécurité
  const checkAddressSecurity = useCallback((currentAddress: string | null) => {
    if (!isAuthenticated || !currentAddress) return true;

    // Si pas encore initialisé, enregistrer l'adresse actuelle comme autorisée
    if (!isSecurityInitializedRef.current) {
      authorizedAddressRef.current = currentAddress.toLowerCase();
      isSecurityInitializedRef.current = true;
      console.log('🔒 Adresse autorisée enregistrée:', currentAddress);
      return true;
    }

    // Vérifier si l'adresse actuelle correspond à l'adresse autorisée
    const isAuthorized = currentAddress.toLowerCase() === authorizedAddressRef.current;
    
    if (!isAuthorized) {
      console.error('🚨 ALERTE SÉCURITÉ: Changement d\'adresse non autorisé détecté');
      console.error('Adresse autorisée:', authorizedAddressRef.current);
      console.error('Adresse actuelle:', currentAddress.toLowerCase());
      
      // Déconnecter immédiatement
      handleSecurityBreach();
      return false;
    }

    return true;
  }, [isAuthenticated]);

  // Fonction pour gérer les violations de sécurité
  const handleSecurityBreach = useCallback(() => {
    console.log('🔒 Déconnexion de sécurité en cours...');
    
    // Nettoyer les données locales
    setAddress(null);
    setBalance({ usdt: 0, usdc: 0 });
    setIsConnected(false);
    setChainId(null);
    localStorage.removeItem('walletConnected');
    
    // Réinitialiser les références de sécurité
    authorizedAddressRef.current = null;
    isSecurityInitializedRef.current = false;
    
    // Déconnecter l'utilisateur de la plateforme
    logout();
    
    // Afficher un message de sécurité
    setTimeout(() => {
      alert('Changement d\'adresse wallet détecté. Vous avez été déconnecté pour des raisons de sécurité.');
    }, 100);
  }, [logout]);

  // Fonction de connexion
  const connectWallet = async () => {
  if (!window.ethereum) {
    alert('Veuillez installer MetaMask');
    return;
  }

  if (!isAuthenticated) {
    alert('Vous devez d\'abord vous authentifier sur la plateforme');
    return;
  }

  setIsConnecting(true);
  try {
    // ÉTAPE 1: Demander explicitement les permissions
    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
    
    // ÉTAPE 2: Maintenant demander les comptes
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length > 0) {
      const userAddress = accounts[0];
      
      // Vérification de sécurité avant de définir l'adresse
      if (!checkAddressSecurity(userAddress)) {
        setIsConnecting(false);
        return;
      }
      
      setAddress(userAddress);
      setIsConnected(true);
      localStorage.setItem('walletConnected', 'true');
      
      console.log('✅ Wallet connecté avec succès:', userAddress);
      console.log('✅ Site maintenant reconnu par MetaMask');
      
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

// Fonction pour permettre le changement de compte
const changeAccount = useCallback(async () => {
  if (!window.ethereum) {
    console.error('MetaMask non détecté');
    return;
  }

  try {
    // Force MetaMask à afficher le sélecteur de compte
    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
    
    // Récupérer le nouveau compte sélectionné
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });
    
    if (accounts.length > 0) {
      const newAddress = accounts[0];
      console.log('🔄 Nouveau compte sélectionné:', newAddress);
      
      // Note: Votre système de sécurité va détecter ce changement
      // et décider s'il est autorisé ou non
    }
  } catch (error) {
    console.error('Erreur changement compte:', error);
  }
}, []);

  // Fonction de déconnexion
  const disconnectWallet = useCallback(() => {
    console.log('🔌 Déconnexion du wallet...');
    setAddress(null);
    setBalance({ usdt: 0, usdc: 0 });
    setIsConnected(false);
    setChainId(null);
    localStorage.removeItem('walletConnected');
    
    // Ne pas réinitialiser les références de sécurité ici
    // car cela pourrait être une déconnexion volontaire
  }, []);

  // Fonction pour vérifier la connexion wallet
  const checkWalletConnection = useCallback(async () => {
    if (!window.ethereum || !isAuthenticated) {
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        const currentAddress = accounts[0];
        
        // Vérification de sécurité
        if (!checkAddressSecurity(currentAddress)) {
          return;
        }
        
        setAddress(currentAddress);
        setIsConnected(true);
        await updateBalances(currentAddress);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion wallet:', error);
      setAddress(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, checkAddressSecurity, updateBalances]);

  // Fonction pour rafraîchir les soldes
  const refreshBalances = useCallback(async () => {
    if (address && isAuthenticated) {
      await updateBalances(address);
    }
  }, [address, isAuthenticated, updateBalances]);

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
    const checkInitialConnection = async () => {
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      
      if (wasConnected && window.ethereum && isAuthenticated) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const userAddress = accounts[0];
            
            // Pour la reconnexion automatique, on considère cette adresse comme autorisée
            if (!isSecurityInitializedRef.current) {
              authorizedAddressRef.current = userAddress.toLowerCase();
              isSecurityInitializedRef.current = true;
              console.log('🔒 Adresse autorisée lors de la reconnexion:', userAddress);
            }
            
            // Vérification de sécurité
            if (checkAddressSecurity(userAddress)) {
              setAddress(userAddress);
              setIsConnected(true);
              await updateBalances(userAddress);
            }
          }
        } catch (error) {
          console.error('Erreur reconnexion:', error);
        }
      }
    };

    if (isAuthenticated) {
      checkInitialConnection();
    }
  }, [isAuthenticated, checkAddressSecurity, updateBalances]);

  // Effet pour récupérer le chainId initial
  useEffect(() => {
    const getCurrentChainId = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const numericChainId = parseInt(chainId, 16);
          
          console.log('🔍 WalletContext ChainId Debug:', {
            rawChainId: chainId,
            numericChainId,
            isBSC: numericChainId === 56
          });
          
          setChainId(numericChainId);
        } catch (error) {
          console.error('Erreur récupération chainId:', error);
        }
      }
    };
    
    getCurrentChainId();
  }, []);

  // Effet pour les événements MetaMask avec sécurité
  useEffect(() => {
    if (!window.ethereum || !isAuthenticated) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log('🔄 Changement d\'adresse MetaMask détecté:', accounts);
      
      if (accounts.length === 0) {
        // L'utilisateur a déconnecté MetaMask
        console.log('❌ Aucun compte MetaMask disponible');
        disconnectWallet();
        return;
      }

      const newAddress = accounts[0];
      
      // Vérification de sécurité critique
      if (!checkAddressSecurity(newAddress)) {
        // La fonction checkAddressSecurity gère déjà la déconnexion
        return;
      }

      // Si l'adresse est autorisée, mettre à jour
      setAddress(newAddress);
      setIsConnected(true);
      await updateBalances(newAddress);
    };

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      console.log('🔗 Changement de réseau détecté:', newChainId);
      setChainId(newChainId);
      
      if (address && isAuthenticated) {
        await updateBalances(address);
      }
    };

    // Ajouter les écouteurs d'événements
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Vérification périodique de sécurité (backup)
    const securityCheckInterval = setInterval(async () => {
      if (!window.ethereum || !isAuthenticated) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          checkAddressSecurity(accounts[0]);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de sécurité périodique:', error);
      }
    }, 3000); // Vérifier toutes les 3 secondes

    // Nettoyage
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      clearInterval(securityCheckInterval);
    };
  }, [address, isAuthenticated, checkAddressSecurity, updateBalances, disconnectWallet]);

  // Effet pour gérer la déconnexion de la plateforme
  useEffect(() => {
    if (!isAuthenticated) {
      // Réinitialiser complètement en cas de déconnexion de la plateforme
      setAddress(null);
      setBalance({ usdt: 0, usdc: 0 });
      setIsConnected(false);
      setChainId(null);
      localStorage.removeItem('walletConnected');
      
      // Réinitialiser les références de sécurité
      authorizedAddressRef.current = null;
      isSecurityInitializedRef.current = false;
      
      console.log('🔒 Wallet déconnecté suite à la déconnexion de la plateforme');
    }
  }, [isAuthenticated]);

  const value: WalletContextType = {
    address,
    balance,
    connectWallet,
    disconnectWallet,
    isConnecting,
    isConnected,
    chainId,
    switchNetwork,
    refreshBalances,
    checkWalletConnection,
    requestAccountPermissions,
    changeAccount
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