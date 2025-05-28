// useContracts.ts
import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { TOKENS } from '../config/tokens';
import { CONTRACTS } from '../config/contracts';

export const useContracts = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [farmingContract, setFarmingContract] = useState<ethers.Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initProvider = useCallback(async () => {
    try {
      // Réinitialiser l'état pour éviter des problèmes de stale data
      setIsInitialized(false);
      
      if (!window.ethereum) {
        throw new Error('MetaMask non détecté');
      }
  
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
  
      // Vérifier la connexion du wallet
      const accounts = await browserProvider.listAccounts();
      if (accounts.length === 0) {
        console.log('Aucun compte connecté dans MetaMask');
        return; // Ne pas initialiser les contrats si aucun compte n'est connecté
      }
      
      const walletSigner = await browserProvider.getSigner();
      setSigner(walletSigner);
      
      // Vérifier les adresses de contrat avant l'initialisation
      if (!CONTRACTS.STAKING.address || CONTRACTS.STAKING.address === '') {
        console.error('Adresse du contrat de staking non définie');
        setError('Configuration des contrats incomplète');
        return;
      }
  
      // Initialisation du contrat avec le signer connecté
      const staking = new ethers.Contract(
        CONTRACTS.STAKING.address, 
        CONTRACTS.STAKING.abi, 
        walletSigner
      );
      
      // Vérifier que le contrat a bien été initialisé
      if (!staking || !staking.interface) {
        throw new Error('Échec de l\'initialisation du contrat de staking');
      }
      
      console.log('Méthodes du contrat de staking:', Object.keys(staking.interface.fragments));
      
      setStakingContract(staking);
      setIsInitialized(true);
      
      // Réinitialiser les erreurs précédentes
      setError(null);
    } catch (err) {
      console.error('Erreur d\'initialisation du provider:', err);
      setError(err instanceof Error ? err.message : 'Échec de l\'initialisation');
    }
  }, []);

  useEffect(() => {
    // Initialiser le provider au chargement du composant
    initProvider();

    if (window.ethereum) {
      // Écouter les changements de compte et de réseau
      const handleAccountsChanged = () => {
        console.log('Comptes changés, réinitialisation des contrats');
        initProvider();
      };
      
      const handleChainChanged = () => {
        console.log('Réseau changé, réinitialisation des contrats');
        initProvider();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [initProvider]);

  const getTokenBalance = useCallback(async (tokenSymbol: 'USDT' | 'USDC', userAddress: string): Promise<string> => {
    try {
      if (!window.ethereum) throw new Error('MetaMask non détecté');
      if (!provider) throw new Error('Provider non initialisé');
      
      const token = TOKENS[tokenSymbol];
      
      // Vérifier que l'adresse du token est valide
      if (!token || !token.address) {
        throw new Error(`Adresse du token ${tokenSymbol} non définie`);
      }
      
      const tokenContract = new ethers.Contract(
        token.address,
        token.abi,
        provider
      );
      
      const balance = await tokenContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, token.decimals);
    } catch (err) {
      console.error(`Erreur lors de la récupération du solde ${tokenSymbol}:`, err);
      // Retourner "0" au lieu de propager l'erreur pour éviter de bloquer l'interface
      return "0";
    }
  }, [provider]);

  const isContractReady = useCallback((contract: ethers.Contract | null): boolean => {
    return contract !== null && provider !== null && signer !== null && isInitialized;
  }, [provider, signer, isInitialized]);

  return {
    provider,
    signer,
    stakingContract,
    farmingContract,
    error,
    getTokenBalance,
    isContractReady,
    isInitialized
  };
};