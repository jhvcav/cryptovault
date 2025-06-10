// src/hooks/useMetaMaskAccountDetector.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

interface UseMetaMaskAccountDetectorProps {
  onAccountChange?: (newAccount: string | null) => void;
}

export const useMetaMaskAccountDetector = (props?: UseMetaMaskAccountDetectorProps) => {
  const { logout, isAuthenticated, user } = useAuth();
  const { disconnectWallet, address } = useWallet();
  const lastKnownAddressRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !window.ethereum) {
      return;
    }

    // Stocker l'adresse initiale lors de la première connexion
    if (!isInitializedRef.current && address) {
      lastKnownAddressRef.current = address.toLowerCase();
      isInitializedRef.current = true;
      console.log('🔍 Adresse initiale enregistrée:', address);
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔄 Changement d\'adresse détecté:', accounts);
      
      const newAddress = accounts.length > 0 ? accounts[0].toLowerCase() : null;
      const lastKnownAddress = lastKnownAddressRef.current;

      // Si l'utilisateur déconnecte complètement MetaMask
      if (!newAddress) {
        console.log('🚪 Déconnexion MetaMask détectée');
        handleUnauthorizedChange();
        return;
      }

      // Si l'adresse a changé par rapport à celle enregistrée
      if (lastKnownAddress && newAddress !== lastKnownAddress) {
        console.log('⚠️ Changement d\'adresse non autorisé détecté');
        console.log('Ancienne adresse:', lastKnownAddress);
        console.log('Nouvelle adresse:', newAddress);
        
        handleUnauthorizedChange();
        return;
      }

      // Callback optionnel pour d'autres actions
      if (props?.onAccountChange) {
        props.onAccountChange(newAddress);
      }
    };

    const handleUnauthorizedChange = () => {
      console.log('🔒 Déconnexion forcée due au changement d\'adresse');
      
      // Déconnecter l'utilisateur
      logout();
      disconnectWallet();
      
      // Reset des références
      lastKnownAddressRef.current = null;
      isInitializedRef.current = false;
      
      // Optionnel : afficher une notification
      if (window.confirm) {
        setTimeout(() => {
          alert('Changement d\'adresse wallet détecté. Vous avez été déconnecté pour des raisons de sécurité.');
        }, 100);
      }
    };

    // Ajouter l'écouteur d'événements
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    // Vérification périodique (backup au cas où les événements ne fonctionnent pas)
    const intervalId = setInterval(async () => {
      if (!window.ethereum || !isAuthenticated) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        handleAccountsChanged(accounts);
      } catch (error) {
        console.error('Erreur lors de la vérification des comptes:', error);
      }
    }, 2000); // Vérifier toutes les 2 secondes

    // Nettoyage
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      clearInterval(intervalId);
    };
  }, [isAuthenticated, address, logout, disconnectWallet, props]);

  // Fonction pour réinitialiser manuellement l'adresse de référence
  const resetTrackedAddress = (newAddress: string) => {
    lastKnownAddressRef.current = newAddress.toLowerCase();
    isInitializedRef.current = true;
    console.log('🔄 Adresse de référence mise à jour:', newAddress);
  };

  return {
    resetTrackedAddress,
    trackedAddress: lastKnownAddressRef.current
  };
};