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
const NFT_CONTRACT_ADDRESS = "0xFC7206e81211F52Fc6Cdb20ac9D4deDC5fb40b72";

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

  // ✅ CORRECTION: Fonction pour déterminer les plans accessibles selon le tier NFT
  const getAccessiblePlans = (highestTier: number, ownedTiers: number[]): number[] => {
    // Vérifier d'abord si l'utilisateur possède un NFT Fidélité (Tier 5)
    const hasFidelityNFT = ownedTiers.includes(5);
    
    switch (highestTier) {
      case 1: // NFT Bronze
        return [0]; // Accès au plan Starter uniquement
      case 2: // NFT Argent
        return [0, 1]; // Accès aux plans Starter + Standard
      case 3: // NFT Or
        return [0, 1, 2]; // Accès aux plans Starter + Standard + Premium
      case 4: // NFT Privilège
        return [0, 1, 2]; // Accès à tous les plans (peut être étendu)
      case 5: // ✅ AJOUTÉ: NFT Fidélité
        return [0]; // Accès au plan Starter uniquement (équivalent au Bronze)
      default:
        // ✅ CORRECTION: Si pas de tier mais possède NFT Fidélité
        if (hasFidelityNFT) {
          return [0]; // Accès au plan Starter
        }
        return []; // Aucun accès sans NFT
    }
  };

  // ✅ AMÉLIORATION: Fonction pour obtenir le meilleur accès possible
  const getBestAccessiblePlans = (ownedTiers: number[]): number[] => {
    if (ownedTiers.length === 0) return [];
    
    // Calculer l'accès maximum basé sur tous les NFT possédés
    const allAccessiblePlans = new Set<number>();
    
    ownedTiers.forEach(tier => {
      const plans = getAccessiblePlans(tier, ownedTiers);
      plans.forEach(plan => allAccessiblePlans.add(plan));
    });
    
    return Array.from(allAccessiblePlans).sort((a, b) => a - b);
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

      // ✅ CORRECTION: Utiliser la nouvelle fonction pour déterminer les plans accessibles
      const accessiblePlans = getBestAccessiblePlans(ownedNFTs);

      console.log('🎯 NFT Access Info (Updated):', {
        address,
        nftCount,
        highestTier: tierNumber,
        multiplier,
        accessiblePlans,
        ownedNFTs,
        hasFidelityNFT: ownedNFTs.includes(5)
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