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

// Détection améliorée de MetaMask pour mobile
const detectMetaMask = (): boolean => {
  // Vérification standard
  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    return true;
  }

  // Vérifications spécifiques mobile
  if (typeof window !== 'undefined') {
    // Vérifier si on est dans l'app MetaMask
    const userAgent = navigator.userAgent || navigator.vendor;
    const isMetaMaskApp = /MetaMask/i.test(userAgent);
    
    // Vérifier différentes propriétés ethereum
    const hasEthereum = !!(
      window.ethereum || 
      (window as any).web3?.currentProvider?.isMetaMask ||
      (window as any).web3?.currentProvider?.selectedAddress
    );
    
    console.log('🔍 Détection MetaMask Mobile:', {
      windowEthereum: !!window.ethereum,
      isMetaMask: window.ethereum?.isMetaMask,
      userAgent: userAgent.substring(0, 100),
      isMetaMaskApp,
      hasEthereum
    });
    
    return isMetaMaskApp || hasEthereum;
  }
  
  return false;
};

const waitForMetaMask = (timeout = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (detectMetaMask()) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = timeout / 100;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (detectMetaMask()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
};

// Fonction pour ouvrir MetaMask sur mobile si pas détecté
const openMetaMaskMobile = () => {
  const currentUrl = window.location.href;
  const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
  
  console.log('🚀 Ouverture MetaMask Mobile:', metamaskDeepLink);
  
  // Tenter d'ouvrir l'app MetaMask
  window.open(metamaskDeepLink, '_blank');
};

// Détection du type d'appareil
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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
  console.log('🔌 Tentative de connexion wallet...');
  console.log('📱 Appareil mobile:', isMobileDevice());
  
  if (!isAuthenticated) {
    alert('Vous devez d\'abord vous authentifier sur la plateforme');
    return;
  }

  setIsConnecting(true);
  
  try {
    // ÉTAPE 1: Attendre que MetaMask soit disponible
    const isMetaMaskAvailable = await waitForMetaMask(5000);
    
    if (!isMetaMaskAvailable) {
      console.log('❌ MetaMask non détecté après attente');
      
      if (isMobileDevice()) {
        const shouldOpenMetaMask = confirm(
          'MetaMask n\'est pas détecté. Voulez-vous ouvrir l\'application MetaMask ?'
        );
        
        if (shouldOpenMetaMask) {
          openMetaMaskMobile();
        }
      } else {
        alert('Veuillez installer MetaMask ou utiliser le navigateur intégré de MetaMask');
      }
      
      setIsConnecting(false);
      return;
    }

    console.log('✅ MetaMask détecté, connexion en cours...');

    // ÉTAPE 2: Demander les permissions (important pour mobile)
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
    } catch (permError) {
      console.log('⚠️ Permissions déjà accordées ou erreur:', permError);
      // Continuer même si les permissions échouent
    }
    
    // ÉTAPE 3: Demander les comptes
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts && accounts.length > 0) {
      const userAddress = accounts[0];
      
      console.log('✅ Compte récupéré:', userAddress);
      
      // Vérification de sécurité
      if (!checkAddressSecurity(userAddress)) {
        setIsConnecting(false);
        return;
      }
      
      setAddress(userAddress);
      setIsConnected(true);
      localStorage.setItem('walletConnected', 'true');
      
      console.log('🎉 Connexion réussie sur mobile!');
      
      // Charger les soldes
      await updateBalances(userAddress);
    } else {
      throw new Error('Aucun compte disponible');
    }
    
  } catch (error) {
    console.error('❌ Erreur connexion mobile:', error);
    
    // Messages d'erreur spécifiques
    if (error.code === 4001) {
      alert('Connexion refusée par l\'utilisateur');
    } else if (error.code === -32002) {
      alert('Une demande de connexion est déjà en cours dans MetaMask');
    } else {
      alert(`Erreur de connexion: ${error.message || 'Erreur inconnue'}`);
    }
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
  console.log('🔍 Vérification connexion wallet mobile...');
  
  if (!isAuthenticated) {
    return;
  }

  try {
    // Attendre que MetaMask soit disponible
    const isAvailable = await waitForMetaMask(2000);
    
    if (!isAvailable) {
      console.log('❌ MetaMask non disponible pour la vérification');
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    
    if (accounts && accounts.length > 0) {
      const currentAddress = accounts[0];
      console.log('✅ Compte trouvé lors de la vérification:', currentAddress);
      
      if (!checkAddressSecurity(currentAddress)) {
        return;
      }
      
      setAddress(currentAddress);
      setIsConnected(true);
      await updateBalances(currentAddress);
    } else {
      console.log('❌ Aucun compte trouvé');
      setAddress(null);
      setIsConnected(false);
    }
  } catch (error) {
    console.error('❌ Erreur vérification connexion mobile:', error);
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
  if (!window.ethereum) {
    throw new Error('MetaMask non disponible');
  }

  console.log('🔄 Tentative de changement vers chainId:', targetChainId);

  try {
    const hexChainId = `0x${targetChainId.toString(16)}`;
    console.log('🔄 HexChainId:', hexChainId);

    // Essayer de changer vers le réseau existant
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    
    console.log('✅ Changement de réseau réussi vers chainId:', targetChainId);
    
  } catch (switchError: any) {
    console.log('❌ Erreur lors du switch, code:', switchError.code);
    
    // Si le réseau n'existe pas (code 4902), l'ajouter
    if (switchError.code === 4902) {
      console.log('📥 Le réseau BSC n\'existe pas, ajout en cours...');
      
      try {
        // Configuration complète pour BSC
        const bscNetworkConfig = {
          chainId: '0x38', // 56 en hexadécimal pour BSC
          chainName: 'BNB Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: [
            'https://bsc-dataseed1.binance.org/',
            'https://bsc-dataseed2.binance.org/',
            'https://bsc-dataseed3.binance.org/',
            'https://bsc-dataseed4.binance.org/',
          ],
          blockExplorerUrls: ['https://bscscan.com/']
        };

        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [bscNetworkConfig]
        });
        
        console.log('✅ Réseau BSC ajouté avec succès');
        
      } catch (addError: any) {
        console.error('❌ Erreur lors de l\'ajout du réseau BSC:', addError);
        
        // Messages d'erreur spécifiques
        if (addError.code === 4001) {
          throw new Error('Ajout du réseau refusé par l\'utilisateur');
        } else {
          throw new Error(`Impossible d'ajouter le réseau BSC: ${addError.message}`);
        }
      }
    } else {
      // Autres erreurs lors du changement
      if (switchError.code === 4001) {
        throw new Error('Changement de réseau refusé par l\'utilisateur');
      } else if (switchError.code === -32002) {
        throw new Error('Une demande est déjà en cours dans MetaMask');
      } else {
        throw new Error(`Erreur lors du changement de réseau: ${switchError.message}`);
      }
    }
  }
};

  // Fonction utilitaire pour diagnostiquer les problèmes mobile
const diagnosticMetaMaskMobile = () => {
  const info = {
    userAgent: navigator.userAgent,
    isMobile: isMobileDevice(),
    hasEthereum: !!window.ethereum,
    isMetaMask: window.ethereum?.isMetaMask,
    isMetaMaskApp: /MetaMask/i.test(navigator.userAgent),
    ethereumProviders: Object.keys(window.ethereum?.providers || {}),
    windowKeys: Object.keys(window).filter(key => key.includes('eth') || key.includes('web3'))
  };
  
  console.log('🔍 Diagnostic MetaMask Mobile:', info);
  return info;
};

  // Effet pour la reconnexion automatique
  useEffect(() => {
  const checkInitialConnection = async () => {
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    
    if (!wasConnected || !isAuthenticated) {
      return;
    }

    console.log('🔄 Tentative de reconnexion automatique...');
    
    try {
      // Sur mobile, attendre que MetaMask soit disponible
      const isMetaMaskAvailable = await waitForMetaMask(3000);
      
      if (!isMetaMaskAvailable) {
        console.log('❌ MetaMask non disponible pour la reconnexion');
        localStorage.removeItem('walletConnected'); // Nettoyer le flag
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        
        console.log('🔄 Reconnexion trouvée:', userAddress);
        
        // Pour la reconnexion automatique, enregistrer comme autorisé
        if (!isSecurityInitializedRef.current) {
          authorizedAddressRef.current = userAddress.toLowerCase();
          isSecurityInitializedRef.current = true;
          console.log('🔒 Adresse autorisée lors de la reconnexion mobile:', userAddress);
        }
        
        // Vérification de sécurité
        if (checkAddressSecurity(userAddress)) {
          setAddress(userAddress);
          setIsConnected(true);
          console.log('✅ Reconnexion automatique réussie sur mobile');
          await updateBalances(userAddress);
        }
      } else {
        console.log('❌ Aucun compte trouvé pour la reconnexion');
        localStorage.removeItem('walletConnected');
      }
    } catch (error) {
      console.error('❌ Erreur reconnexion mobile:', error);
      localStorage.removeItem('walletConnected');
    }
  };

  if (isAuthenticated) {
    // Sur mobile, attendre un peu plus longtemps avant de vérifier
    const delay = isMobileDevice() ? 1000 : 500;
    
    setTimeout(() => {
      checkInitialConnection();
    }, delay);
  }
}, [isAuthenticated, checkAddressSecurity, updateBalances]);

  // Effet pour récupérer le chainId initial
  // Effet pour récupérer et maintenir le chainId synchronisé
useEffect(() => {
  const getCurrentChainId = async () => {
    if (window.ethereum && isConnected) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const numericChainId = parseInt(chainId, 16);
        
        console.log('🔍 WalletContext ChainId Debug:', {
          rawChainId: chainId,
          numericChainId,
          isBSC: numericChainId === 56,
          isConnected
        });
        
        setChainId(numericChainId);
      } catch (error) {
        console.error('Erreur récupération chainId:', error);
        setChainId(null);
      }
    } else {
      // Si pas connecté, reset le chainId
      setChainId(null);
    }
  };
  
  // Récupérer le chainId initial et à chaque changement de connexion
  getCurrentChainId();
  
  // Vérification périodique du chainId quand connecté
  let chainCheckInterval: NodeJS.Timeout;
  
  if (isConnected && window.ethereum) {
    chainCheckInterval = setInterval(getCurrentChainId, 2000);
  }
  
  return () => {
    if (chainCheckInterval) {
      clearInterval(chainCheckInterval);
    }
  };
}, [isConnected]); // Dépendance sur isConnected

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