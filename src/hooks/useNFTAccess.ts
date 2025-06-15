// hooks/useNFTAccess.ts
import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

// ABI simplifié pour lire les NFT
const NFT_CONTRACT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function nftToTier(uint256 tokenId) external view returns (uint256)",
  "function getUserHighestTier(address user) external view returns (uint256)",
  "function getUserMultiplier(address user) external view returns (uint256)"
];

// Adresse du contrat NFT sur BSC
const NFT_CONTRACT_ADDRESS = "0x3b9E6cad77E65e153321C91Ac5225a4C564b3aE4";

interface NFTAccessInfo {
  hasNFT: boolean;
  highestTier: number;
  multiplier: number;
  accessiblePlans: number[]; // IDs des plans accessibles (0,1,2)
  ownedNFTs: number[]; // Tiers des NFT possédés
  loading: boolean;
  error: string | null;
}

export const useNFTAccess = (): NFTAccessInfo => {
  const { address, isConnected } = useWallet();
  const [nftInfo, setNftInfo] = useState<NFTAccessInfo>({
    hasNFT: false,
    highestTier: 0,
    multiplier: 1,
    accessiblePlans: [],
    ownedNFTs: [],
    loading: false,
    error: null
  });

  // Fonction pour déterminer les plans accessibles selon le tier NFT
  const getAccessiblePlans = (highestTier: number): number[] => {
    switch (highestTier) {
      case 1: // NFT Bronze
        return [0]; // Accès au plan Starter uniquement
      case 2: // NFT Argent
        return [0, 1]; // Accès aux plans Starter + Standard
      case 3: // NFT Or
        return [0, 1, 2]; // Accès aux plans Starter + Standard + Premium
      case 4: // NFT Privilège
        return [0, 1, 2]; // Accès à tous les plans (peut être étendu)
      default:
        return []; // Aucun accès sans NFT
    }
  };

  // Fonction pour convertir le multiplicateur du contrat (120 = 1.2x)
  const formatMultiplier = (contractMultiplier: number): number => {
    return contractMultiplier / 100;
  };

  // Charger les informations NFT de l'utilisateur
  const loadNFTAccess = async () => {
    if (!address || !isConnected) {
      setNftInfo({
        hasNFT: false,
        highestTier: 0,
        multiplier: 1,
        accessiblePlans: [],
        ownedNFTs: [],
        loading: false,
        error: null
      });
      return;
    }

    setNftInfo(prev => ({ ...prev, loading: true, error: null }));

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

      // Obtenir le nombre de NFT possédés
      const balance = await nftContract.balanceOf(address);
      const nftCount = Number(balance);

      if (nftCount === 0) {
        // Aucun NFT possédé
        setNftInfo({
          hasNFT: false,
          highestTier: 0,
          multiplier: 1,
          accessiblePlans: [],
          ownedNFTs: [],
          loading: false,
          error: null
        });
        return;
      }

      // Obtenir les informations du tier le plus élevé
      const highestTier = await nftContract.getUserHighestTier(address);
      const contractMultiplier = await nftContract.getUserMultiplier(address);
      
      const tierNumber = Number(highestTier);
      const multiplier = formatMultiplier(Number(contractMultiplier));

      // Obtenir tous les tiers possédés
      const ownedNFTs: number[] = [];
      for (let i = 0; i < nftCount; i++) {
        try {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const tier = await nftContract.nftToTier(tokenId);
          ownedNFTs.push(Number(tier));
        } catch (error) {
          console.warn(`Erreur lors de la lecture du NFT ${i}:`, error);
        }
      }

      // Déterminer les plans accessibles
      const accessiblePlans = getAccessiblePlans(tierNumber);

      console.log('🎯 NFT Access Info:', {
        address,
        nftCount,
        highestTier: tierNumber,
        multiplier,
        accessiblePlans,
        ownedNFTs
      });

      setNftInfo({
        hasNFT: true,
        highestTier: tierNumber,
        multiplier,
        accessiblePlans,
        ownedNFTs,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Erreur lors du chargement des NFT:', error);
      setNftInfo({
        hasNFT: false,
        highestTier: 0,
        multiplier: 1,
        accessiblePlans: [],
        ownedNFTs: [],
        loading: false,
        error: error.message || 'Erreur lors du chargement des NFT'
      });
    }
  };

  // Recharger les informations quand l'adresse ou la connexion change
  useEffect(() => {
    loadNFTAccess();
  }, [address, isConnected]);

  // Fonction pour recharger manuellement
  const refetch = () => {
    loadNFTAccess();
  };

  return {
    ...nftInfo,
    refetch
  };
};

export default useNFTAccess;