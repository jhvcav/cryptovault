// scripts/generate-nft-images.mjs (version sans numéros fixes)
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Données des NFT SANS numéros fixes
const nftData = [
  {
    id: 1,
    title: 'NFT BRONZE',
    subtitle: 'Accès de Base',
    accessLevel: 'Essentiel',
    icon: 'bronze-medal',
    colorScheme: 'bronze',
    filename: 'bronze.png'
  },
  {
    id: 2,
    title: 'NFT ARGENT', 
    subtitle: 'Accès Intermédiaire',
    accessLevel: 'Avancé',
    icon: 'silver-medal',
    colorScheme: 'silver',
    filename: 'silver.png'
  },
  {
    id: 3,
    title: 'NFT GOLD',
    subtitle: 'Accès Premium', 
    accessLevel: 'Premium',
    icon: 'gold-medal',
    colorScheme: 'gold',
    filename: 'gold.png'
  },
  {
    id: 4,
    title: 'NFT PRIVILÈGE',
    subtitle: 'Accès Exclusif',
    accessLevel: 'Exclusif', 
    icon: 'diamond',
    colorScheme: 'privilege',
    filename: 'privilege.png'
  }
];

// Styles CSS avec icônes personnalisées (inchangé)
const colorSchemes = {
  bronze: {
    background: 'linear-gradient(135deg, #cd7f32 0%, #8b4513 25%, #a0522d 50%, #daa520 75%, #cd7f32 100%)',
    borderColor: '#8b4513',
    shadowColor: 'rgba(205, 127, 50, 0.3)',
    glowColor: 'linear-gradient(45deg, #cd7f32, #daa520, #8b4513)',
  },
  silver: {
    background: 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 25%, #a8a8a8 50%, #d3d3d3 75%, #e8e8e8 100%)',
    borderColor: '#a8a8a8',
    shadowColor: 'rgba(192, 192, 192, 0.3)',
    glowColor: 'linear-gradient(45deg, #e8e8e8, #c0c0c0, #a8a8a8)',
  },
  gold: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 25%, #ff8c00 50%, #ffa500 75%, #ffd700 100%)',
    borderColor: '#ff8c00',
    shadowColor: 'rgba(255, 215, 0, 0.4)',
    glowColor: 'linear-gradient(45deg, #ffd700, #ffb347, #ff8c00)',
  },
  privilege: {
    background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 20%, #e74c3c 40%, #f39c12 60%, #e67e22 80%, #9b59b6 100%)',
    borderColor: '#8e44ad',
    shadowColor: 'rgba(155, 89, 182, 0.4)',
    glowColor: 'linear-gradient(45deg, #9b59b6, #e74c3c, #f39c12, #8e44ad)',
  },
};

// Fonction pour générer l'icône CSS (inchangé)
function generateIconCSS(iconType) {
  switch (iconType) {
    case 'bronze-medal':
      return `
        .icon-content {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #cd7f32, #daa520);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(205, 127, 50, 0.6);
        }
        .icon-content::before {
          content: "3";
          font-size: 2.5rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .icon-content::after {
          content: "";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          background: #8b4513;
          border-radius: 10px 10px 0 0;
        }
      `;
    
    case 'silver-medal':
      return `
        .icon-content {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(192, 192, 192, 0.6);
        }
        .icon-content::before {
          content: "2";
          font-size: 2.5rem;
          font-weight: bold;
          color: #333;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
        }
        .icon-content::after {
          content: "";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          background: #a8a8a8;
          border-radius: 10px 10px 0 0;
        }
      `;
    
    case 'gold-medal':
      return `
        .icon-content {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ffd700, #ffb347);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
        }
        .icon-content::before {
          content: "1";
          font-size: 2.5rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .icon-content::after {
          content: "";
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 10px;
          background: #ff8c00;
          border-radius: 10px 10px 0 0;
        }
      `;
    
    case 'diamond':
      return `
        .icon-content {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #9b59b6, #e74c3c, #f39c12);
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(155, 89, 182, 0.8);
          clip-path: polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%);
        }
        .icon-content::before {
          content: "♦";
          font-size: 2rem;
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          transform: rotate(-45deg);
        }
      `;
    
    default:
      return `
        .icon-content {
          width: 80px;
          height: 80px;
          background: #ccc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-content::before {
          content: "?";
          font-size: 2rem;
          color: #666;
        }
      `;
  }
}

// Fonction pour générer le HTML d'une carte NFT SANS numéro fixe
function generateNFTCardHTML(nft) {
  const scheme = colorSchemes[nft.colorScheme];
  const iconCSS = generateIconCSS(nft.icon);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .nft-card {
          position: relative;
          width: 400px;
          height: 600px;
          border-radius: 20px;
          overflow: hidden;
          border: 3px solid ${scheme.borderColor};
          background: ${scheme.background};
          box-shadow: 0 15px 35px ${scheme.shadowColor}, inset 0 0 20px rgba(255,255,255,0.1);
        }
        
        .shimmer {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(1px);
        }
        
        .content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          color: white;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 12px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          margin-top: 0;
        }
        
        .header p {
          font-size: 1rem;
          opacity: 0.9;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          margin: 0;
        }
        
        .center-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }
        
        .icon-container {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255,255,255,0.3);
        }
        
        /* Styles d'icône personnalisés */
        ${iconCSS}
        
        .footer {
          text-align: center;
        }
        
        .access-level {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 16px;
          font-weight: 500;
        }
        
        .brand {
          font-size: 1rem;
          opacity: 0.8;
          letter-spacing: 3px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        /* Animation de pulsation pour le diamant */
        ${nft.icon === 'diamond' ? `
        .icon-content {
          animation: pulse 2s ease-in-out infinite alternate;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 30px rgba(155, 89, 182, 0.8); }
          100% { box-shadow: 0 0 40px rgba(155, 89, 182, 1), 0 0 60px rgba(233, 116, 60, 0.6); }
        }
        ` : ''}
      </style>
    </head>
    <body>
      <div class="nft-card">
        <div class="shimmer"></div>
        <div class="overlay"></div>
        <div class="content">
          <div class="header">
            <h1>${nft.title}</h1>
            <p>${nft.subtitle}</p>
          </div>
          
          <div class="center-icon">
            <div class="icon-container">
              <div class="icon-content"></div>
            </div>
          </div>
          
          <div class="footer">
            <p class="access-level">Niveau d'Accès: ${nft.accessLevel}</p>
            <p class="brand">CRYPTOVAULT</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fonction pour attendre
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction principale pour générer toutes les images
async function generateAllNFTImages() {
  console.log('🎨 Génération des images NFT (version finale sans numéros)...\n');
  
  // Créer le dossier de sortie
  const outputDir = path.join(__dirname, '..', 'generated-nft-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Puppeteer lancé avec succès');
    
    for (const nft of nftData) {
      console.log(`📸 Génération de l'image: ${nft.filename}...`);
      console.log(`   🎯 Tier: ${nft.title} - ${nft.accessLevel}`);
      
      let page;
      try {
        page = await browser.newPage();
        
        // Définir la taille de la page pour une image de haute qualité
        await page.setViewport({ 
          width: 440, 
          height: 640, 
          deviceScaleFactor: 2
        });
        
        // Charger le HTML de la carte
        const html = generateNFTCardHTML(nft);
        await page.setContent(html, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        // Attendre le rendu complet
        console.log(`   ⏳ Rendu CSS et animations...`);
        await sleep(4000);
        
        // Capturer l'image
        const imagePath = path.join(outputDir, nft.filename);
        await page.screenshot({
          path: imagePath,
          type: 'png',
          clip: {
            x: 20,
            y: 20, 
            width: 400,
            height: 600
          },
          omitBackground: false
        });
        
        console.log(`✅ Image générée: ${imagePath}`);
        
      } catch (error) {
        console.error(`❌ Erreur pour ${nft.filename}:`, error.message);
      } finally {
        if (page) {
          await page.close();
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur Puppeteer:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Puppeteer fermé');
    }
  }
  
  console.log('\n🎉 Images NFT finales générées !');
  console.log(`📁 Dossier: ${outputDir}`);
  
  // Vérifier que les images ont bien été créées
  const generatedImages = [];
  for (const nft of nftData) {
    const imagePath = path.join(outputDir, nft.filename);
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      generatedImages.push({
        file: nft.filename,
        size: `${Math.round(stats.size / 1024)}KB`,
        path: imagePath
      });
    }
  }
  
  if (generatedImages.length > 0) {
    console.log('\n📸 Images générées avec succès:');
    generatedImages.forEach(img => {
      console.log(`   ✅ ${img.file} (${img.size})`);
    });
    
    console.log('\n🎯 Design final:');
    console.log('   🥉 Bronze: Médaille "3" + "CRYPTOVAULT"');
    console.log('   🥈 Argent: Médaille "2" + "CRYPTOVAULT"'); 
    console.log('   🥇 Or: Médaille "1" + "CRYPTOVAULT"');
    console.log('   💎 Privilège: Diamant animé + "CRYPTOVAULT"');
    console.log('\n   ✨ Chaque NFT aura son numéro unique dans les métadonnées !');
  }
  
  // Générer aussi les métadonnées avec numéros dynamiques
  generateMetadata(outputDir);
}

// Fonction pour générer les métadonnées JSON avec numéros dynamiques
function generateMetadata(imagesDir) {
  console.log('\n📝 Génération des métadonnées JSON avec numéros dynamiques...');
  
  const metadataDir = path.join(imagesDir, 'metadata');
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }
  
  nftData.forEach(nft => {
    const tierDir = path.join(metadataDir, nft.colorScheme);
    if (!fs.existsSync(tierDir)) {
      fs.mkdirSync(tierDir, { recursive: true });
    }
    
    const supply = nft.id === 1 ? 1000 : nft.id === 2 ? 500 : nft.id === 3 ? 200 : 50;
    
    for (let i = 1; i <= supply; i++) {
      const metadata = {
        name: `${nft.title} #${i}`, // ← NUMÉRO DYNAMIQUE ICI
        description: `${nft.subtitle} - Niveau d'accès ${nft.accessLevel} pour la plateforme CryptoVault. Ce NFT donne accès aux stratégies d'investissement correspondantes avec des multiplicateurs de bonus exclusifs.`,
        image: `https://nft.cryptovault.com/images/${nft.filename}`, // ← MÊME IMAGE POUR TOUS
        external_url: "https://cryptovault.com",
        attributes: [
          {
            trait_type: "Tier",
            value: nft.title.replace('NFT ', '')
          },
          {
            trait_type: "Numéro",
            value: i // ← NUMÉRO UNIQUE DANS LES ATTRIBUTS
          },
          {
            trait_type: "Niveau d'Accès", 
            value: nft.accessLevel
          },
          {
            trait_type: "Multiplicateur",
            value: nft.id === 1 ? "1.2x" : nft.id === 2 ? "1.5x" : nft.id === 3 ? "2.0x" : "2.5x"
          },
          {
            trait_type: "Bonus",
            value: nft.id === 1 ? "+20%" : nft.id === 2 ? "+50%" : nft.id === 3 ? "+100%" : "+150%"
          },
          {
            trait_type: "Rareté",
            value: nft.id === 1 ? "Commun" : nft.id === 2 ? "Peu Commun" : nft.id === 3 ? "Rare" : "Légendaire"
          },
          {
            trait_type: "Supply Total",
            value: supply
          }
        ]
      };
      
      const metadataPath = path.join(tierDir, `${i}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    console.log(`✅ Métadonnées générées pour ${nft.title}: ${supply} fichiers`);
  });
  
  console.log('\n🎯 SYSTÈME FINAL:');
  console.log('📸 4 images fixes (bronze.png, silver.png, gold.png, privilege.png)');
  console.log('📝 1750 métadonnées avec numéros uniques (#1, #2, #47, #128, etc.)');
  console.log('🔗 Chaque métadata.json pointe vers la même image pour son tier');
  console.log('🚀 Système optimisé et professionnel !');
}

// Exécution
generateAllNFTImages().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});

export { generateAllNFTImages, nftData, colorSchemes };