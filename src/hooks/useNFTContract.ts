// src/hooks/useNFTContract.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAuth } from '../contexts/AuthContext';

// ABI du contrat NFT (extrait des fonctions principales)
const NFT_CONTRACT_ABI = [
  // Fonctions de lecture
  "function nftTiers(uint256) view returns (uint256 price, uint256 supply, uint256 minted, string baseURI, bool active, string name, string description, uint256 multiplier, uint256 createdAt)",
  "function getAllActiveTiers() view returns (uint256[])",
  "function getTierInfo(uint256 tier) view returns (tuple(uint256 price, uint256 supply, uint256 minted, string baseURI, bool active, string name, string description, uint256 multiplier, string[] accessPlans, uint256 createdAt))",
  "function getRevenueStats() view returns (uint256 totalRev, uint256[] tierIds, uint256[] tierRevenues)",
  "function isSpecialTier(uint256) view returns (bool)",
  "function getRemainingSupply(uint256 tier) view returns (uint256)",
  "function getSpecialTiers() view returns (uint256[])",
  "function owner() view returns (address)",
  "function totalRevenue() view returns (uint256)",
  "function tierRevenue(uint256) view returns (uint256)",
  "function nextTierId() view returns (uint256)",
  
  // Fonctions d'écriture (Owner seulement)
  "function createNewTier(string name, string description, uint256 price, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans, bool isSpecial) returns (uint256)",
  "function createEventNFT(string name, string description, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans) returns (uint256)",
  "function createPartnershipNFT(string partnerName, string description, uint256 price, uint256 supply, uint256 multiplier, string baseURI, string[] accessPlans) returns (uint256)",
  "function mintSpecialNFT(address to, uint256 tier, string reason)",
  "function updateTier(uint256 tier, uint256 newPrice, uint256 newSupply, bool active)",
  "function pauseTier(uint256 tier)",
  "function unpauseTier(uint256 tier)",
  "function setFidelityEligible(address user, bool eligible)",
  "function setMultipleFidelityEligible(address[] users, bool eligible)",
  
  // Fonctions publiques
  "function purchaseNFT(uint256 tier)",
  "function claimMyFidelityNFT()",
  
  // Events
  "event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 tier, uint256 price)",
  "event TierCreated(uint256 indexed tier, string name, uint256 price, uint256 supply)",
  "event TierUpdated(uint256 indexed tier, uint256 price, uint256 supply)",
  "event SpecialNFTMinted(address indexed to, uint256 indexed tokenId, uint256 tier, string reason)",
  "event FidelityNFTClaimed(address indexed user, uint256 indexed tokenId)"
];

const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0xFC7206e81211F52Fc6Cdb20ac9D4deDC5fb40b72';
const BSC_RPC_URL = import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';

export interface NFTTier {
  id: number;
  name: string;
  description: string;
  price: string;
  supply: number;
  minted: number;
  multiplier: number;
  active: boolean;
  baseURI: string;
  accessPlans: string[];
  createdAt: number;
  isSpecial: boolean;
}

export interface RevenueStats {
  totalRevenue: string;
  tierIds: number[];
  tierRevenues: string[];
}

export const useNFTContract = () => {
  const { user } = useAuth();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialiser la connexion au contrat
  useEffect(() => {
    const initContract = async () => {
      try {
        setLoading(true);
        
        // Provider read-only pour BSC
        const bscProvider = new ethers.JsonRpcProvider(BSC_RPC_URL);
        setProvider(bscProvider);
        
        // Contrat en lecture seule
        const readOnlyContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          bscProvider
        );
        
        // Si l'utilisateur a MetaMask connecté
        if (window.ethereum && user?.walletAddress) {
          try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            setSigner(web3Signer);
            
            // Contrat avec signer pour les transactions
            const writableContract = new ethers.Contract(
              CONTRACT_ADDRESS,
              NFT_CONTRACT_ABI,
              web3Signer
            );
            
            setContract(writableContract);
            
            // Vérifier si l'utilisateur est owner
            const ownerAddress = await readOnlyContract.owner();
            const userAddress = await web3Signer.getAddress();
            setIsOwner(ownerAddress.toLowerCase() === userAddress.toLowerCase());
            
          } catch (metamaskError) {
            console.warn('MetaMask non disponible, utilisation du mode lecture seule');
            setContract(readOnlyContract);
          }
        } else {
          setContract(readOnlyContract);
        }
        
      } catch (err) {
        console.error('Erreur initialisation contrat:', err);
        setError(err instanceof Error ? err.message : 'Erreur de connexion au contrat');
      } finally {
        setLoading(false);
      }
    };

    initContract();
  }, [user?.walletAddress]);

  // Fonction pour récupérer tous les tiers
  const getAllTiers = useCallback(async (): Promise<NFTTier[]> => {
    if (!contract) throw new Error('Contrat non initialisé');
    
    try {
      const activeTierIds = await contract.getAllActiveTiers();
      const specialTierIds = await contract.getSpecialTiers();
      
      const tiers: NFTTier[] = [];
      
      // Récupérer les infos de chaque tier
      for (const tierId of activeTierIds) {
        const tierInfo = await contract.getTierInfo(tierId);
        const isSpecial = specialTierIds.includes(tierId);
        
        tiers.push({
          id: Number(tierId),
          name: tierInfo.name,
          description: tierInfo.description,
          price: ethers.formatUnits(tierInfo.price, 18), // USDC a 18 décimales dans le contrat
          supply: Number(tierInfo.supply),
          minted: Number(tierInfo.minted),
          multiplier: Number(tierInfo.multiplier),
          active: tierInfo.active,
          baseURI: tierInfo.baseURI,
          accessPlans: tierInfo.accessPlans,
          createdAt: Number(tierInfo.createdAt),
          isSpecial
        });
      }
      
      return tiers;
    } catch (err) {
      console.error('Erreur getAllTiers:', err);
      throw err;
    }
  }, [contract]);

  // Fonction pour récupérer les stats de revenus
  const getRevenueStats = useCallback(async (): Promise<RevenueStats> => {
    if (!contract) throw new Error('Contrat non initialisé');
    
    try {
      const stats = await contract.getRevenueStats();
      
      return {
        totalRevenue: ethers.formatUnits(stats.totalRev, 18),
        tierIds: stats.tierIds.map((id: any) => Number(id)),
        tierRevenues: stats.tierRevenues.map((rev: any) => ethers.formatUnits(rev, 18))
      };
    } catch (err) {
      console.error('Erreur getRevenueStats:', err);
      throw err;
    }
  }, [contract]);

  // Fonction pour créer un nouveau tier (Owner seulement)
  const createNewTier = useCallback(async (
    name: string,
    description: string,
    price: string,
    supply: number,
    multiplier: number,
    baseURI: string,
    accessPlans: string[],
    isSpecial: boolean = false
  ): Promise<string> => {
    if (!contract || !signer) throw new Error('Contrat ou signer non disponible');
    if (!isOwner) throw new Error('Seul le owner peut créer des tiers');
    
    try {
      const priceWei = ethers.parseUnits(price, 18);
      
      const tx = await contract.createNewTier(
        name,
        description,
        priceWei,
        supply,
        multiplier,
        baseURI,
        accessPlans,
        isSpecial
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      console.error('Erreur createNewTier:', err);
      throw err;
    }
  }, [contract, signer, isOwner]);

  // Fonction pour mettre à jour un tier
  const updateTier = useCallback(async (
    tierId: number,
    newPrice: string,
    newSupply: number,
    active: boolean
  ): Promise<string> => {
    if (!contract || !signer) throw new Error('Contrat ou signer non disponible');
    if (!isOwner) throw new Error('Seul le owner peut modifier les tiers');
    
    try {
      const priceWei = ethers.parseUnits(newPrice, 18);
      
      const tx = await contract.updateTier(tierId, priceWei, newSupply, active);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      console.error('Erreur updateTier:', err);
      throw err;
    }
  }, [contract, signer, isOwner]);

  // Fonction pour activer/désactiver un tier
  const toggleTier = useCallback(async (
    tierId: number,
    active: boolean
  ): Promise<string> => {
    if (!contract || !signer) throw new Error('Contrat ou signer non disponible');
    if (!isOwner) throw new Error('Seul le owner peut modifier les tiers');
    
    try {
      const tx = active 
        ? await contract.unpauseTier(tierId)
        : await contract.pauseTier(tierId);
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      console.error('Erreur toggleTier:', err);
      throw err;
    }
  }, [contract, signer, isOwner]);

  // Fonction pour minter un NFT spécial
  const mintSpecialNFT = useCallback(async (
    toAddress: string,
    tierId: number,
    reason: string
  ): Promise<string> => {
    if (!contract || !signer) throw new Error('Contrat ou signer non disponible');
    if (!isOwner) throw new Error('Seul le owner peut minter des NFT spéciaux');
    
    try {
      const tx = await contract.mintSpecialNFT(toAddress, tierId, reason);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      console.error('Erreur mintSpecialNFT:', err);
      throw err;
    }
  }, [contract, signer, isOwner]);

  // Fonction pour acheter un NFT (utilisateur)
  const purchaseNFT = useCallback(async (tierId: number): Promise<string> => {
    if (!contract || !signer) throw new Error('Contrat ou signer non disponible');
    
    try {
      const tx = await contract.purchaseNFT(tierId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      console.error('Erreur purchaseNFT:', err);
      throw err;
    }
  }, [contract, signer]);

  // Fonction pour écouter les événements
  const setupEventListeners = useCallback((callbacks: {
    onTierCreated?: (tierId: number, name: string, price: string, supply: number) => void;
    onNFTPurchased?: (buyer: string, tokenId: number, tier: number, price: string) => void;
    onSpecialNFTMinted?: (to: string, tokenId: number, tier: number, reason: string) => void;
  }) => {
    if (!contract) return;

    // Écouter les événements TierCreated
    if (callbacks.onTierCreated) {
      contract.on('TierCreated', (tierId, name, price, supply) => {
        callbacks.onTierCreated!(
          Number(tierId),
          name,
          ethers.formatUnits(price, 18),
          Number(supply)
        );
      });
    }

    // Écouter les événements NFTPurchased
    if (callbacks.onNFTPurchased) {
      contract.on('NFTPurchased', (buyer, tokenId, tier, price) => {
        callbacks.onNFTPurchased!(
          buyer,
          Number(tokenId),
          Number(tier),
          ethers.formatUnits(price, 18)
        );
      });
    }

    // Écouter les événements SpecialNFTMinted
    if (callbacks.onSpecialNFTMinted) {
      contract.on('SpecialNFTMinted', (to, tokenId, tier, reason) => {
        callbacks.onSpecialNFTMinted!(
          to,
          Number(tokenId),
          Number(tier),
          reason
        );
      });
    }

    // Fonction de nettoyage
    return () => {
      contract.removeAllListeners();
    };
  }, [contract]);

  return {
    contract,
    provider,
    signer,
    isOwner,
    loading,
    error,
    
    // Fonctions
    getAllTiers,
    getRevenueStats,
    createNewTier,
    updateTier,
    toggleTier,
    mintSpecialNFT,
    purchaseNFT,
    setupEventListeners
  };
};