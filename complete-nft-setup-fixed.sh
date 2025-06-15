#!/bin/bash
# complete-nft-setup-fixed.sh - Setup NFT avec support ES modules

set -e

echo "🎨 Setup Complet des NFT CryptoVault (ES Modules)"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        echo "Installer Node.js depuis: https://nodejs.org"
        exit 1
    fi
    log_success "Node.js trouvé: $(node --version)"
}

# Détecter le type de module
detect_module_type() {
    if [ -f package.json ]; then
        if grep -q '"type": "module"' package.json; then
            MODULE_TYPE="esm"
            SCRIPT_EXT=".mjs"
            log_info "Projet détecté: ES Modules"
        else
            MODULE_TYPE="commonjs"
            SCRIPT_EXT=".js"
            log_info "Projet détecté: CommonJS"
        fi
    else
        MODULE_TYPE="commonjs"
        SCRIPT_EXT=".js"
        log_info "Pas de package.json, utilisation CommonJS par défaut"
    fi
}

# Installer les dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    # Vérifier si package.json existe
    if [ ! -f package.json ]; then
        log_warning "package.json manquant, création..."
        npm init -y
    fi
    
    # Installer les dépendances nécessaires
    local deps_to_install=""
    
    if ! npm list puppeteer &> /dev/null; then
        deps_to_install="$deps_to_install puppeteer"
    fi
    
    if ! npm list axios &> /dev/null; then
        deps_to_install="$deps_to_install axios"
    fi
    
    if ! npm list form-data &> /dev/null; then
        deps_to_install="$deps_to_install form-data"
    fi
    
    if ! npm list dotenv &> /dev/null; then
        deps_to_install="$deps_to_install dotenv"
    fi
    
    if [ -n "$deps_to_install" ]; then
        log_info "Installation de:$deps_to_install"
        npm install $deps_to_install
    fi
    
    log_success "Dépendances installées"
}

# Vérifier les scripts
check_scripts() {
    local image_script="scripts/generate-nft-images${SCRIPT_EXT}"
    local ipfs_script="scripts/upload-to-ipfs${SCRIPT_EXT}"
    
    if [ ! -f "$image_script" ]; then
        log_error "Script $image_script manquant"
        log_info "Assurez-vous d'avoir créé les scripts avec l'extension correcte"
        exit 1
    fi
    
    log_success "Scripts trouvés avec extension $SCRIPT_EXT"
}

# Vérifier le fichier .env
check_env_file() {
    if [ ! -f .env ]; then
        log_warning "Fichier .env manquant"
        cat > .env << EOF
# Configuration Pinata IPFS
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here

# Configuration Smart Contract
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
EOF
        log_info "Fichier .env créé"
        
        log_warning "⚠️  IMPORTANT: Éditez le fichier .env avec vos vraies valeurs !"
        echo ""
        echo "Pour obtenir les clés Pinata:"
        echo "1. Créer un compte sur https://pinata.cloud"
        echo "2. Aller dans API Keys"
        echo "3. Créer une nouvelle clé"
        echo ""
        echo "Appuyez sur Entrée quand .env est configuré..."
        read
    fi
}

# Générer les images NFT
generate_images() {
    log_info "Génération des images NFT depuis ton design React..."
    
    local script_path="scripts/generate-nft-images${SCRIPT_EXT}"
    
    if [ "$MODULE_TYPE" = "esm" ]; then
        node "$script_path"
    else
        node "$script_path"
    fi
    
    if [ -d generated-nft-images ]; then
        log_success "Images générées dans: generated-nft-images/"
        
        # Lister les fichiers générés
        echo ""
        echo "📸 Images générées:"
        ls -la generated-nft-images/*.png 2>/dev/null | while read line; do
            echo "   $line"
        done
        
        echo ""
        echo "📝 Métadonnées générées:"
        local json_count=$(find generated-nft-images/metadata -name "*.json" 2>/dev/null | wc -l)
        echo "   $json_count fichiers JSON créés"
    else
        log_error "Échec de la génération des images"
        exit 1
    fi
}

# Upload vers IPFS
upload_to_ipfs() {
    log_info "Upload des NFT vers IPFS..."
    
    # Vérifier les clés Pinata dans .env
    if grep -q "your_api_key_here" .env; then
        log_warning "Les clés Pinata ne sont pas configurées dans .env"
        echo "Voulez-vous continuer sans upload IPFS ? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Configurez d'abord les clés Pinata dans .env"
            exit 0
        fi
        return
    fi
    
    local script_path="scripts/upload-to-ipfs${SCRIPT_EXT}"
    
    if [ "$MODULE_TYPE" = "esm" ]; then
        node "$script_path"
    else
        node "$script_path"
    fi
    
    if [ -f generated-nft-images/ipfs-upload-summary.json ]; then
        log_success "Upload IPFS terminé !"
        echo ""
        echo "📄 Résumé disponible dans: generated-nft-images/ipfs-upload-summary.json"
    fi
}

# Générer la configuration pour le smart contract
generate_contract_config() {
    log_info "Génération de la configuration smart contract..."
    
    # Créer le script de génération de config (compatible ES modules)
    cat > "scripts/generate-contract-config${SCRIPT_EXT}" << 'EOF'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateContractConfig() {
    const summaryPath = path.join(__dirname, '..', 'generated-nft-images', 'ipfs-upload-summary.json');
    
    if (!fs.existsSync(summaryPath)) {
        console.log('❌ Résumé IPFS non trouvé. Utilisez des URLs locales.');
        return generateLocalConfig();
    }
    
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const config = summary.smartContractConfig;
    
    const contractUpdate = `
// Mise à jour des baseURI dans le smart contract
// À copier dans votre fonction _initializeBaseTiers()

// NFT Bronze (Tier 1)
nftTiers[1].baseURI = "${config.bronze.baseURI}";

// NFT Argent (Tier 2)  
nftTiers[2].baseURI = "${config.silver.baseURI}";

// NFT Or (Tier 3)
nftTiers[3].baseURI = "${config.gold.baseURI}";

// NFT Privilège (Tier 4)
nftTiers[4].baseURI = "${config.privilege.baseURI}";
`;

    const frontendConfig = `
// Configuration frontend pour les images
export const NFT_IMAGES = {
    bronze: "${config.bronze.imageURL}",
    silver: "${config.silver.imageURL}", 
    gold: "${config.gold.imageURL}",
    privilege: "${config.privilege.imageURL}"
};

export const NFT_METADATA_BASE_URLS = {
    bronze: "${config.bronze.baseURI}",
    silver: "${config.silver.baseURI}",
    gold: "${config.gold.baseURI}", 
    privilege: "${config.privilege.baseURI}"
};
`;

    // Sauvegarder les configurations
    const configDir = path.join(__dirname, '..', 'generated-configs');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(configDir, 'contract-baseuri-update.sol'), contractUpdate);
    fs.writeFileSync(path.join(configDir, 'frontend-nft-config.ts'), frontendConfig);
    
    console.log('✅ Configuration smart contract générée dans: generated-configs/');
    console.log('📋 Fichiers créés:');
    console.log('   - contract-baseuri-update.sol');  
    console.log('   - frontend-nft-config.ts');
}

function generateLocalConfig() {
    const contractUpdate = `
// Configuration locale (à remplacer par IPFS plus tard)
// À copier dans votre fonction _initializeBaseTiers()

// NFT Bronze (Tier 1)
nftTiers[1].baseURI = "https://your-server.com/metadata/bronze/";

// NFT Argent (Tier 2)
nftTiers[2].baseURI = "https://your-server.com/metadata/silver/";

// NFT Or (Tier 3)  
nftTiers[3].baseURI = "https://your-server.com/metadata/gold/";

// NFT Privilège (Tier 4)
nftTiers[4].baseURI = "https://your-server.com/metadata/privilege/";
`;

    const configDir = path.join(__dirname, '..', 'generated-configs');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(configDir, 'contract-baseuri-local.sol'), contractUpdate);
    console.log('📝 Configuration locale générée: generated-configs/contract-baseuri-local.sol');
}

generateContractConfig();
EOF

    # Adapter pour CommonJS si nécessaire
    if [ "$MODULE_TYPE" = "commonjs" ]; then
        cat > "scripts/generate-contract-config.js" << 'EOF'
const fs = require('fs');
const path = require('path');

function generateContractConfig() {
    const summaryPath = path.join(__dirname, '..', 'generated-nft-images', 'ipfs-upload-summary.json');
    
    if (!fs.existsSync(summaryPath)) {
        console.log('❌ Résumé IPFS non trouvé. Utilisez des URLs locales.');
        return generateLocalConfig();
    }
    
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const config = summary.smartContractConfig;
    
    const contractUpdate = `
// Mise à jour des baseURI dans le smart contract
nftTiers[1].baseURI = "${config.bronze.baseURI}";
nftTiers[2].baseURI = "${config.silver.baseURI}";
nftTiers[3].baseURI = "${config.gold.baseURI}";
nftTiers[4].baseURI = "${config.privilege.baseURI}";
`;

    const configDir = path.join(__dirname, '..', 'generated-configs');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(configDir, 'contract-baseuri-update.sol'), contractUpdate);
    console.log('✅ Configuration générée: generated-configs/contract-baseuri-update.sol');
}

function generateLocalConfig() {
    const contractUpdate = `
// Configuration locale
nftTiers[1].baseURI = "https://your-server.com/metadata/bronze/";
nftTiers[2].baseURI = "https://your-server.com/metadata/silver/";
nftTiers[3].baseURI = "https://your-server.com/metadata/gold/";
nftTiers[4].baseURI = "https://your-server.com/metadata/privilege/";
`;

    const configDir = path.join(__dirname, '..', 'generated-configs');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(configDir, 'contract-baseuri-local.sol'), contractUpdate);
    console.log('📝 Configuration locale générée');
}

generateContractConfig();
EOF
    fi

    node "scripts/generate-contract-config${SCRIPT_EXT}"
    log_success "Configuration smart contract générée"
}

# Afficher le résumé final
show_summary() {
    echo ""
    echo "🎉 SETUP NFT TERMINÉ !"
    echo "====================="
    echo ""
    
    echo "📁 Fichiers générés:"
    echo "   📸 generated-nft-images/ - Images PNG des NFT"
    echo "   📝 generated-nft-images/metadata/ - Métadonnées JSON"
    echo "   🔧 generated-configs/ - Configuration smart contract"
    
    if [ -f generated-nft-images/ipfs-upload-summary.json ]; then
        echo "   ☁️  IPFS upload summary"
    fi
    
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Vérifier les images dans generated-nft-images/"
    echo "   2. Copier la config dans ton smart contract"
    echo "   3. Déployer le contrat avec les baseURI"
    echo "   4. Tester l'affichage des NFT dans Metamask"
    
    echo ""
    echo "🔧 Pour mettre à jour ton smart contract:"
    echo "   Copier le contenu de: generated-configs/contract-baseuri-update.sol"
    echo "   Dans votre fonction _initializeBaseTiers()"
    
    echo ""
    echo "✅ Vos designs React sont maintenant des vrais NFT !"
}

# Menu principal
show_menu() {
    echo "Que voulez-vous faire ?"
    echo "1) Setup complet (génération + IPFS)"
    echo "2) Génération d'images uniquement"  
    echo "3) Upload IPFS uniquement"
    echo "4) Configuration smart contract uniquement"
    echo "5) Quitter"
    echo ""
    echo -n "Votre choix (1-5): "
}

# Fonction principale
main() {
    # Détecter le type de module d'abord
    detect_module_type
    
    # Parse des arguments
    if [ "$1" = "--full" ]; then
        OPERATION="full"
    elif [ "$1" = "--images" ]; then
        OPERATION="images"
    elif [ "$1" = "--ipfs" ]; then
        OPERATION="ipfs"
    elif [ "$1" = "--config" ]; then
        OPERATION="config"
    else
        show_menu
        read -r choice
        case $choice in
            1) OPERATION="full" ;;
            2) OPERATION="images" ;;
            3) OPERATION="ipfs" ;;
            4) OPERATION="config" ;;
            5) exit 0 ;;
            *) log_error "Choix invalide"; exit 1 ;;
        esac
    fi
    
    # Vérifications initiales
    check_nodejs
    
    # Exécution selon l'opération choisie
    case $OPERATION in
        "full")
            install_dependencies
            check_scripts
            check_env_file
            generate_images
            upload_to_ipfs
            generate_contract_config
            show_summary
            ;;
        "images")
            install_dependencies
            check_scripts
            generate_images
            log_success "Génération d'images terminée"
            ;;
        "ipfs")
            check_env_file
            upload_to_ipfs
            log_success "Upload IPFS terminé"
            ;;
        "config")
            generate_contract_config
            log_success "Configuration générée"
            ;;
    esac
}

# Afficher l'aide
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --full     Setup complet (génération + IPFS + config)"
    echo "  --images   Génération d'images uniquement"
    echo "  --ipfs     Upload IPFS uniquement"
    echo "  --config   Configuration smart contract uniquement"
    echo "  -h, --help Afficher cette aide"
    echo ""
    echo "Note: Le script détecte automatiquement si votre projet"
    echo "      utilise ES modules ou CommonJS"
    echo ""
    exit 0
fi

# Exécution
main "$@"