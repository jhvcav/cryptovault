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

  const initProvider = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask non détecté');
      }
  
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
  
      const signer = await provider.getSigner();
      setSigner(signer);
  
      // Initialisation du contrat
      const staking = new ethers.Contract(
        CONTRACTS.STAKING.address, 
        CONTRACTS.STAKING.abi, 
        signer
      );
  
      console.log('Méthodes du contrat de staking:', Object.keys(staking));
      
      setStakingContract(staking);
    } catch (err) {
      console.error('Erreur d\'initialisation du provider:', err);
      setError(err instanceof Error ? err.message : 'Échec de l\'initialisation');
    }
  }, []);

  useEffect(() => {
    initProvider();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', initProvider);
      window.ethereum.on('chainChanged', initProvider);

      return () => {
        window.ethereum.removeListener('accountsChanged', initProvider);
        window.ethereum.removeListener('chainChanged', initProvider);
      };
    }
  }, [initProvider]);

  const getTokenBalance = useCallback(async (tokenSymbol: 'USDT' | 'USDC', userAddress: string): Promise<string> => {
    try {
      if (!window.ethereum) throw new Error('MetaMask non détecté');
      if (!provider) throw new Error('Provider non initialisé');
      
      const token = TOKENS[tokenSymbol];
      const tokenContract = new ethers.Contract(
        token.address,
        token.abi,
        provider
      );
      
      const balance = await tokenContract.balanceOf(userAddress);
      return ethers.formatUnits(balance, token.decimals);
    } catch (err) {
      console.error('Erreur lors de la récupération du solde:', err);
      throw err;
    }
  }, [provider]);

  const isContractReady = useCallback((contract: ethers.Contract | null): boolean => {
    return contract !== null && provider !== null && signer !== null;
  }, [provider, signer]);

  return {
    provider,
    signer,
    stakingContract,
    farmingContract,
    error,
    getTokenBalance,
    isContractReady
  };
};