// src/services/pinataService.ts
import axios from 'axios';

// Configuration Pinata
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://olive-quick-dolphin-266.mypinata.cloud/ipfs/';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  animation_url?: string;
  background_color?: string;
}

export interface PinataFileInfo {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  date_pinned: string;
  date_unpinned?: string;
  metadata: {
    name?: string;
    keyvalues?: Record<string, any>;
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
}

export interface PinataQueryResponse {
  count: number;
  rows: PinataFileInfo[];
}

class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;

  constructor() {
    // Variables d'environnement (à configurer dans votre .env)
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY || '';
    this.apiSecret = import.meta.env.VITE_PINATA_API_SECRET || '';
    this.jwt = import.meta.env.VITE_PINATA_JWT || '';
    

    if (!this.jwt && (!this.apiKey || !this.apiSecret)) {
      console.warn('Configuration Pinata manquante. Fonctionnalités limitées.');
    }
  }

  // Headers pour les requêtes Pinata
  private getHeaders() {
  const headers: any = {
    'Content-Type': 'application/json'
  };

  if (this.jwt) {
    headers['Authorization'] = `Bearer ${this.jwt}`;
    
    // 🔧 DEBUG: Vérifier ce qui est envoyé
    console.log('🔧 Headers envoyés à Pinata:');
    console.log('Content-Type:', headers['Content-Type']);
    console.log('Authorization début:', headers['Authorization'].substring(0, 50) + '...');
    console.log('JWT utilisé début:', this.jwt.substring(0, 30) + '...');
    
  } else if (this.apiKey && this.apiSecret) {
    headers['pinata_api_key'] = this.apiKey;
    headers['pinata_secret_api_key'] = this.apiSecret;
    console.log('🔧 Utilisation API Key/Secret mode');
  } else {
    console.error('❌ Aucune authentification configurée !');
  }

  return headers;
}

  // Tester la connexion à Pinata
  async testAuthentication(): Promise<boolean> {
  try {
    console.log('🧪 Test authentification Pinata...');
    console.log('URL:', `${PINATA_API_URL}/data/testAuthentication`);
    
    const headers = this.getHeaders();
    console.log('📋 Headers complets:', headers);
    
    const response = await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: headers
    });
    
    console.log('✅ Réponse Pinata:', response.data);
    console.log('✅ Status:', response.status);
    return response.data.message === 'Congratulations! You are communicating with the Pinata API!';
    
  } catch (error) {
    console.error('❌ Erreur détaillée:');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Request Headers:', error.config?.headers);
    
    return false;
  }
}

  // Récupérer tous les fichiers épinglés
  async getAllPinnedFiles(metadata?: Record<string, any>): Promise<PinataQueryResponse> {
    try {
      const params: any = {
        status: 'pinned',
        pageLimit: 1000
      };

      // Ajouter des filtres de métadonnées si fournis
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          params[`metadata[keyvalues][${key}]`] = metadata[key];
        });
      }

      const response = await axios.get(`${PINATA_API_URL}/data/pinList`, {
        headers: this.getHeaders(),
        params
      });

      return response.data;
    } catch (error) {
      console.error('Erreur récupération fichiers Pinata:', error);
      throw error;
    }
  }

  // Récupérer les métadonnées d'un fichier JSON depuis IPFS
  async getMetadataFromIPFS(ipfsHash: string): Promise<NFTMetadata> {
    try {
      const url = `${PINATA_GATEWAY}${ipfsHash}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erreur récupération métadonnées ${ipfsHash}:`, error);
      throw error;
    }
  }

  // Récupérer les métadonnées d'un token depuis une base URI
  async getTokenMetadata(baseURI: string, tokenId: number): Promise<NFTMetadata | null> {
    try {
      // Extraire le hash IPFS de l'URI de base
      const ipfsMatch = baseURI.match(/\/ipfs\/([a-zA-Z0-9]+)/);
      if (!ipfsMatch) {
        throw new Error('Format d\'URI IPFS invalide');
      }

      const baseHash = ipfsMatch[1];
      const metadataUrl = `${PINATA_GATEWAY}${baseHash}/${tokenId}.json`;
      
      const response = await axios.get(metadataUrl);
      return response.data;
    } catch (error) {
      console.error(`Erreur récupération métadonnées token ${tokenId}:`, error);
      return null;
    }
  }

  // Rechercher des fichiers NFT par tier
  async getNFTFilesByTier(tierName: string): Promise<PinataFileInfo[]> {
    try {
      const allFiles = await this.getAllPinnedFiles({
        tier: tierName
      });

      // Filtrer les fichiers JSON (métadonnées)
      return allFiles.rows.filter(file => 
        file.metadata.name?.includes('.json') || 
        file.metadata.name?.toLowerCase().includes('metadata')
      );
    } catch (error) {
      console.error(`Erreur recherche fichiers tier ${tierName}:`, error);
      throw error;
    }
  }

  // Récupérer tous les métadonnées NFT pour un tier donné
  async getAllNFTMetadataForTier(baseURI: string, maxTokens: number = 1000): Promise<Array<{
    tokenId: number;
    metadata: NFTMetadata | null;
    ipfsUrl: string;
  }>> {
    const results = [];
    
    for (let tokenId = 1; tokenId <= maxTokens; tokenId++) {
      try {
        const metadata = await this.getTokenMetadata(baseURI, tokenId);
        const ipfsMatch = baseURI.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        const ipfsUrl = ipfsMatch ? `${PINATA_GATEWAY}${ipfsMatch[1]}/${tokenId}.json` : '';
        
        results.push({
          tokenId,
          metadata,
          ipfsUrl
        });

        // Si on trouve une métadonnée null, on s'arrête (assume que les tokens sont séquentiels)
        if (!metadata) {
          break;
        }
      } catch (error) {
        // Token n'existe pas, on s'arrête
        break;
      }
    }

    return results;
  }

  // Vérifier la cohérence entre les NFT mintés et les métadonnées
  async verifyMetadataConsistency(tiers: Array<{
    id: number;
    name: string;
    baseURI: string;
    minted: number;
  }>) {
    const results = [];

    for (const tier of tiers) {
      try {
        console.log(`Vérification tier ${tier.name}...`);
        
        // Récupérer les métadonnées pour ce tier
        const metadataList = await this.getAllNFTMetadataForTier(tier.baseURI, tier.minted);
        
        // Compter les métadonnées valides
        const validMetadata = metadataList.filter(item => item.metadata !== null);
        
        results.push({
          tierId: tier.id,
          tierName: tier.name,
          contractMinted: tier.minted,
          pinataMetadata: validMetadata.length,
          consistent: tier.minted === validMetadata.length,
          baseURI: tier.baseURI,
          metadataDetails: validMetadata,
          missingTokens: tier.minted - validMetadata.length
        });
        
      } catch (error) {
        console.error(`Erreur vérification tier ${tier.name}:`, error);
        results.push({
          tierId: tier.id,
          tierName: tier.name,
          contractMinted: tier.minted,
          pinataMetadata: 0,
          consistent: false,
          baseURI: tier.baseURI,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          metadataDetails: [],
          missingTokens: tier.minted
        });
      }
    }

    return results;
  }

  // Uploader un fichier vers Pinata
  async uploadFile(file: File, metadata?: Record<string, any>): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: file.name,
          keyvalues: metadata
        }));
      }

      const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Erreur upload fichier Pinata:', error);
      throw error;
    }
  }

  // Uploader des métadonnées JSON vers Pinata
  async uploadMetadata(metadata: NFTMetadata, name: string): Promise<string> {
    try {
      const response = await axios.post(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, metadata, {
        headers: this.getHeaders(),
        data: {
          pinataMetadata: {
            name: name,
            keyvalues: {
              type: 'nft_metadata'
            }
          }
        }
      });

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Erreur upload métadonnées Pinata:', error);
      throw error;
    }
  }

  // Obtenir l'URL publique d'un fichier IPFS
  getPublicUrl(ipfsHash: string): string {
    return `${PINATA_GATEWAY}${ipfsHash}`;
  }

  // Extraire le hash IPFS d'une URL
  extractIpfsHash(url: string): string | null {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  // Supprimer un fichier de Pinata
  async unpinFile(ipfsHash: string): Promise<boolean> {
    try {
      await axios.delete(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
        headers: this.getHeaders()
      });
      return true;
    } catch (error) {
      console.error(`Erreur suppression fichier ${ipfsHash}:`, error);
      return false;
    }
  }
}

// Instance singleton du service
export const pinataService = new PinataService();

// Hook React pour utiliser le service Pinata
import { useState, useEffect, useCallback } from 'react';

export const usePinata = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const auth = await pinataService.testAuthentication();
        setIsAuthenticated(auth);
        
        if (!auth) {
          setError('Authentification Pinata échouée. Vérifiez vos clés API.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de connexion Pinata');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const verifyTierConsistency = useCallback(async (tiers: any[]) => {
    try {
      setLoading(true);
      const results = await pinataService.verifyMetadataConsistency(tiers);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur vérification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetadataForTier = useCallback(async (baseURI: string, minted: number) => {
    try {
      const results = await pinataService.getAllNFTMetadataForTier(baseURI, minted);
      return results.filter(r => r.metadata !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur récupération métadonnées');
      throw err;
    }
  }, []);

  return {
    isAuthenticated,
    loading,
    error,
    service: pinataService,
    verifyTierConsistency,
    getMetadataForTier
  };
};