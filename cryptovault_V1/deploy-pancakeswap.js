// deploy-pancakeswap.js
const { execSync } = require('child_process');

try {
  console.log('Déploiement des contrats sur BSC...');
  execSync('npx hardhat run scripts/deployPancakeswap.ts --config hardhat.config.cjs --network bsc', { 
    stdio: 'inherit' 
  });
  console.log('Déploiement terminé avec succès.');
} catch (error) {
  console.error('Erreur lors du déploiement:', error.message);
  process.exit(1);
}