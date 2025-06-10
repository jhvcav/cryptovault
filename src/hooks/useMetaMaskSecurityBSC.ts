// src/hooks/useMetaMaskSecurityBSC.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

interface MetaMaskSecurityOptions {
  onUnauthorizedChange?: (oldAddress: string, newAddress: string) => void;
  onSecurityBreach?: () => void;
  checkInterval?: number; // en millisecondes
  enableLogging?: boolean;
}

export const useMetaMaskSecurityBSC = (options: MetaMaskSecurityOptions = {}) => {
  const { logout, isAuthenticated } = useAuth();
  const { address, disconnectWallet } = useWallet();
  
  const {
    onUnauthorizedChange,
    onSecurityBreach,
    checkInterval = 2000,
    enableLogging = true
  } = options;

  // Références pour le suivi de sécurité
  const authorizedAddressRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const lastCheckTimeRef = useRef<number>(Date.now());

  // Fonction de logging conditionnel
  const securityLog = useCallback((message: string, ...args: any[]) => {
    if (enableLogging) {
      console.log(`🔒 [MetaMask Security BSC] ${message}`, ...args);
    }
  }, [enableLogging]);

  // Fonction pour enregistrer l'adresse autorisée
  const registerAuthorizedAddress = useCallback((newAddress: string) => {
    authorizedAddressRef.current = newAddress.toLowerCase();
    isInitializedRef.current = true;
    lastCheckTimeRef.current = Date.now();
    securityLog('Adresse autorisée enregistrée:', newAddress);
  }, [securityLog]);

  // Fonction pour vérifier l'autorisation d'une adresse
  const isAddressAuthorized = useCallback((addressToCheck: string): boolean => {
    if (!authorizedAddressRef.current || !isInitializedRef.current) {
      return false;
    }
    
    return addressToCheck.toLowerCase() === authorizedAddressRef.current;
  }, []);

  // Fonction pour gérer les violations de sécurité
  const handleSecurityBreach = useCallback((oldAddress?: string, newAddress?: string) => {
    securityLog('🚨 VIOLATION DE SÉCURITÉ DÉTECTÉE');
    
    if (oldAddress && newAddress) {
      securityLog('Changement non autorisé:', { 
        from: oldAddress, 
        to: newAddress 
      });
      
      // Callback optionnel
      if (onUnauthorizedChange) {
        onUnauthorizedChange(oldAddress, newAddress);
      }
    }

    // Déconnexion immédiate
    disconnectWallet();
    logout();
    
    // Réinitialiser les références
    authorizedAddressRef.current = null;
    isInitializedRef.current = false;
    
    // Callback optionnel
    if (onSecurityBreach) {
      onSecurityBreach();
    }
    
    // Message d'alerte utilisateur
    setTimeout(() => {
      alert('⚠️ Changement d\'adresse wallet détecté.\n\nVous avez été déconnecté pour votre sécurité.\n\nVeuillez vous reconnecter avec l\'adresse autorisée.');
    }, 100);
    
    securityLog('Utilisateur déconnecté pour violation de sécurité');
  }, [disconnectWallet, logout, onUnauthorizedChange, onSecurityBreach, securityLog]);

  // Fonction principale de vérification de sécurité
  const checkSecurity = useCallback(async () => {
    if (!window.ethereum || !isAuthenticated) {
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        // L'utilisateur a déconnecté MetaMask
        securityLog('Aucun compte MetaMask disponible');
        
        if (isInitializedRef.current) {
          handleSecurityBreach();
        }
        return;
      }

      const currentAddress = accounts[0];

      // Si c'est la première initialisation avec cette adresse
      if (!isInitializedRef.current && address === currentAddress) {
        registerAuthorizedAddress(currentAddress);
        return;
      }

      // Vérifier l'autorisation si déjà initialisé
      if (isInitializedRef.current && !isAddressAuthorized(currentAddress)) {
        handleSecurityBreach(authorizedAddressRef.current || 'unknown', currentAddress);
        return;
      }

      // Mettre à jour le timestamp de la dernière vérification
      lastCheckTimeRef.current = Date.now();
      
    } catch (error) {
      console.error('Erreur lors de la vérification de sécurité MetaMask:', error);
    }
  }, [isAuthenticated, address, registerAuthorizedAddress, isAddressAuthorized, handleSecurityBreach, securityLog]);

  // Effet pour la surveillance continue
  useEffect(() => {
    if (!isAuthenticated) {
      // Réinitialiser en cas de déconnexion de la plateforme
      authorizedAddressRef.current = null;
      isInitializedRef.current = false;
      return;
    }

    // Écouteur d'événements MetaMask
    const handleAccountsChanged = (accounts: string[]) => {
      securityLog('Événement accountsChanged reçu:', accounts);
      
      // Vérification immédiate lors du changement
      setTimeout(checkSecurity, 100);
    };

    const handleChainChanged = (chainId: string) => {
      securityLog('Changement de réseau détecté:', parseInt(chainId, 16));
      // Pas de vérification de sécurité nécessaire pour le changement de réseau
    };

    // Ajouter les écouteurs si disponibles
    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Vérification périodique (backup)
    const securityInterval = setInterval(checkSecurity, checkInterval);

    // Vérification initiale
    checkSecurity();

    // Nettoyage
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
      clearInterval(securityInterval);
    };
  }, [isAuthenticated, checkSecurity, checkInterval]);

  // Effet pour surveiller les changements d'adresse dans le contexte
  useEffect(() => {
    if (address && isAuthenticated && !isInitializedRef.current) {
      registerAuthorizedAddress(address);
    }
  }, [address, isAuthenticated, registerAuthorizedAddress]);

  // Fonctions utilitaires exposées
  const getSecurityStatus = useCallback(() => {
    return {
      isInitialized: isInitializedRef.current,
      authorizedAddress: authorizedAddressRef.current,
      currentAddress: address,
      isSecure: address ? isAddressAuthorized(address) : false,
      lastCheck: lastCheckTimeRef.current,
      timeSinceLastCheck: Date.now() - lastCheckTimeRef.current
    };
  }, [address, isAddressAuthorized]);

  const forceSecurityCheck = useCallback(() => {
    securityLog('Vérification de sécurité forcée');
    checkSecurity();
  }, [checkSecurity, securityLog]);

  const resetSecurity = useCallback(() => {
    authorizedAddressRef.current = null;
    isInitializedRef.current = false;
    securityLog('Sécurité réinitialisée');
  }, [securityLog]);

  return {
    getSecurityStatus,
    forceSecurityCheck,
    resetSecurity,
    isInitialized: isInitializedRef.current,
    authorizedAddress: authorizedAddressRef.current
  };
};