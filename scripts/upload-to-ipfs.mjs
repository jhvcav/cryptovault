// scripts/upload-to-ipfs.mjs
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

// Configuration Pinata
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';

class IPFSUploader {
  constructor() {
    this.baseURL = 'https://api.pinata.cloud';
    this.gateway = 'https://gateway.pinata.cloud/ipfs';
  }

  // Tester la connexion à Pinata
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/data/testAuthentication`, {
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      });
      
      console.log('✅ Connexion Pinata réussie:', response.data.message);
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion Pinata:', error.response?.data || error.message);
      return false;
    }
  }

  // Upload d'un fichier vers IPFS
  async uploadFile(filePath, fileName) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          project: 'CryptoVault-NFT',
          type: 'image'
        }
      });
      
      formData.append('pinataMetadata', metadata);
      
      const response = await axios.post(`${this.baseURL}/pinning/pinFileToIPFS`, formData, {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      });
      
      const ipfsHash = response.data.IpfsHash;
      const publicURL = `${this.gateway}/${ipfsHash}`;
      
      console.log(`📤 ${fileName} uploadé:`, publicURL);
      
      return {
        ipfsHash,
        publicURL,
        fileName
      };
      
    } catch (error) {
      console.error(`❌ Erreur upload ${fileName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Upload d'un dossier complet
  async uploadFolder(folderPath, folderName) {
    try {
      const formData = new FormData();
      
      // Ajouter tous les fichiers du dossier
      const files = fs.readdirSync(folderPath);
      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        if (fs.statSync(filePath).isFile()) {
          formData.append('file', fs.createReadStream(filePath), {
            filepath: file
          });
        }
      });
      
      const metadata = JSON.stringify({
        name: folderName,
        keyvalues: {
          project: 'CryptoVault-NFT',
          type: 'folder'
        }
      });
      
      formData.append('pinataMetadata', metadata);
      
      const response = await axios.post(`${this.baseURL}/pinning/pinFileToIPFS`, formData, {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      });
      
      const ipfsHash = response.data.IpfsHash;
      const publicURL = `${this.gateway}/${ipfsHash}`;
      
      console.log(`📁 Dossier ${folderName} uploadé:`, publicURL);
      
      return {
        ipfsHash,
        publicURL,
        folderName
      };
      
    } catch (error) {
      console.error(`❌ Erreur upload dossier ${folderName}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Upload JSON vers IPFS
  async uploadJSON(jsonData, fileName) {
    try {
      const response = await axios.post(`${this.baseURL}/pinning/pinJSONToIPFS`, jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      });
      
      const ipfsHash = response.data.IpfsHash;
      const publicURL = `${this.gateway}/${ipfsHash}`;
      
      console.log(`📄 ${fileName} uploadé:`, publicURL);
      
      return {
        ipfsHash,
        publicURL,
        fileName
      };
      
    } catch (error) {
      console.error(`❌ Erreur upload JSON ${fileName}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

// Fonction principale d'upload
async function uploadNFTsToIPFS() {
  console.log('🚀 Upload des NFT vers IPFS via Pinata...\n');
  
  // Vérifier les clés API
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('❌ Clés API Pinata manquantes !');
    console.log('📋 Pour obtenir les clés:');
    console.log('1. Créer un compte sur https://pinata.cloud');
    console.log('2. Aller dans API Keys');
    console.log('3. Créer une nouvelle clé');
    console.log('4. Ajouter dans .env:');
    console.log('   PINATA_API_KEY=your_api_key');
    console.log('   PINATA_SECRET_KEY=your_secret_key');
    return;
  }
  
  const uploader = new IPFSUploader();
  
  // Tester la connexion
  const connected = await uploader.testConnection();
  if (!connected) {
    console.error('❌ Impossible de se connecter à Pinata');
    return;
  }
  
  const imagesDir = path.join(__dirname, '..', 'generated-nft-images');
  const results = {
    images: {},
    metadata: {},
    summary: {}
  };
  
  try {
    // 1. Upload des images individuelles
    console.log('\n📸 Upload des images NFT...');
    const imageFiles = ['bronze.png', 'silver.png', 'gold.png', 'privilege.png'];
    
    for (const imageFile of imageFiles) {
      const imagePath = path.join(imagesDir, imageFile);
      if (fs.existsSync(imagePath)) {
        const result = await uploader.uploadFile(imagePath, imageFile);
        results.images[imageFile] = result;
        
        // Délai pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 2. Upload des métadonnées par tier
    console.log('\n📝 Upload des métadonnées...');
    const metadataDir = path.join(imagesDir, 'metadata');
    const tiers = ['bronze', 'silver', 'gold', 'privilege'];
    
    for (const tier of tiers) {
      const tierDir = path.join(metadataDir, tier);
      if (fs.existsSync(tierDir)) {
        const result = await uploader.uploadFolder(tierDir, `metadata-${tier}`);
        results.metadata[tier] = result;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 3. Générer et sauvegarder le résumé
    console.log('\n📋 Génération du résumé...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      images: results.images,
      metadata: results.metadata,
      smartContractConfig: {
        bronze: {
          baseURI: results.metadata.bronze ? `${results.metadata.bronze.publicURL}/` : '',
          imageURL: results.images['bronze.png']?.publicURL || ''
        },
        silver: {
          baseURI: results.metadata.silver ? `${results.metadata.silver.publicURL}/` : '',
          imageURL: results.images['silver.png']?.publicURL || ''
        },
        gold: {
          baseURI: results.metadata.gold ? `${results.metadata.gold.publicURL}/` : '',
          imageURL: results.images['gold.png']?.publicURL || ''
        },
        privilege: {
          baseURI: results.metadata.privilege ? `${results.metadata.privilege.publicURL}/` : '',
          imageURL: results.images['privilege.png']?.publicURL || ''
        }
      }
    };
    
    // Sauvegarder le résumé localement
    const summaryPath = path.join(imagesDir, 'ipfs-upload-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Upload du résumé sur IPFS aussi
    const summaryResult = await uploader.uploadJSON(summary, 'ipfs-upload-summary.json');
    results.summary = summaryResult;
    
    // 4. Afficher les résultats
    console.log('\n🎉 Upload terminé avec succès !');
    console.log('\n📊 RÉSUMÉ DES UPLOADS:');
    
    console.log('\n📸 Images:');
    Object.entries(results.images).forEach(([file, data]) => {
      console.log(`   ${file}: ${data.publicURL}`);
    });
    
    console.log('\n📝 Métadonnées:');
    Object.entries(results.metadata).forEach(([tier, data]) => {
      console.log(`   ${tier}: ${data.publicURL}`);
    });
    
    console.log('\n🔧 Configuration Smart Contract:');
    console.log('Copier ces URLs dans ton contrat:');
    
    Object.entries(summary.smartContractConfig).forEach(([tier, config]) => {
      console.log(`   nftTiers[${tier === 'bronze' ? '1' : tier === 'silver' ? '2' : tier === 'gold' ? '3' : '4'}].baseURI = "${config.baseURI}";`);
    });
    
    console.log('\n📄 Résumé complet:', summaryResult.publicURL);
    
  } catch (error) {
    console.error('❌ Erreur pendant l\'upload:', error);
  }
}

// Exécution
uploadNFTsToIPFS().catch(console.error);

export { IPFSUploader, uploadNFTsToIPFS };