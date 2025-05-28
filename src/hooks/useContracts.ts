import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

// Nous supprimons la déclaration qui était ici car elle est maintenant dans ethereum.d.ts

export const useContracts = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  // Ajout d'un flag pour éviter les reconnexions multiples
  const [hasConnected, setHasConnected] = useState<boolean>(false);

  const connect = useCallback(async () => {
    // Éviter de se connecter si on est déjà en cours de connexion
    if (connectionStatus === 'connecting') return false;
    
    try {
      setConnectionStatus('connecting');
      
      if (!window.ethereum) {
        throw new Error("Aucun portefeuille Ethereum détecté. Veuillez installer MetaMask.");
      }
      
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
      
      // Créer un provider spécifique au navigateur
      const web3Provider = new ethers.BrowserProvider(window.ethereum as any);
      setProvider(web3Provider);
      
      // Utiliser la bonne méthode pour obtenir un signataire avec ethers.js v6
      const web3Signer = await web3Provider.getSigner();
      setSigner(web3Signer);
      
      const address = await web3Signer.getAddress();
      setAccount(address);
      
      const contract = new ethers.Contract(
        CONTRACTS.STAKING.address,
        CONTRACTS.STAKING.abi,
        web3Signer
      );
      setStakingContract(contract);
      
      setConnectionStatus('connected');
      setError(null);
      setHasConnected(true);
      localStorage.setItem('walletConnected', 'true');
      
      return true;
    } catch (err) {
      console.error("Erreur lors de la connexion:", err);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
      setConnectionStatus('disconnected');
      return false;
    }
  }, [connectionStatus]);

  // Effet pour la connexion initiale - séparé de l'effet de gestion des événements
  useEffect(() => {
    // Ne se connecter qu'une seule fois au démarrage
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    if (wasConnected && !hasConnected && window.ethereum) {
      connect();
    }
  }, [connect, hasConnected]);

  // Effet pour gérer les événements de changement de compte et de chaîne
  useEffect(() => {
    if (!window.ethereum) return;
    
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setConnectionStatus('disconnected');
        setAccount(null);
        setSigner(null);
        setStakingContract(null);
        localStorage.removeItem('walletConnected');
      } else if (accounts[0] !== account) {
        // Ne mettre à jour le signer que si le provider existe déjà
        if (provider) {
          try {
            // Utiliser la bonne méthode pour obtenir un signataire dans ethers.js v6
            const web3Provider = provider as ethers.BrowserProvider;
            const newSigner = await web3Provider.getSigner();
            setSigner(newSigner);
            setAccount(accounts[0]);
            
            const contract = new ethers.Contract(
              CONTRACTS.STAKING.address,
              CONTRACTS.STAKING.abi,
              newSigner
            );
            setStakingContract(contract);
            setConnectionStatus('connected');
            localStorage.setItem('walletConnected', 'true');
          } catch (error) {
            console.error("Erreur lors du changement de compte:", error);
          }
        }
      }
    };
    
    const handleChainChanged = () => {
      window.location.reload();
    };
    
    (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
    (window.ethereum as any).on('chainChanged', handleChainChanged);
    
    // Ne pas appeler connect() ici - c'était la source de la boucle
    
    return () => {
      if (window.ethereum) {
        (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
        (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [provider, account]); // On doit garder account ici pour la comparaison

  return {
    provider,
    signer,
    stakingContract,
    account,
    connectionStatus,
    error,
    connect
  };
};

export default useContracts;