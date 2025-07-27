// scripts/hardhat-wrapper.ts
import { execSync } from 'child_process';

const network = process.argv.includes('--network') 
  ? process.argv[process.argv.indexOf('--network') + 1] 
  : 'hardhat';

try {
  execSync(`npx hardhat run scripts/deployPancakeswap.ts --config hardhat.config.cjs --network ${network}`, { 
    stdio: 'inherit' 
  });
} catch (error) {
  process.exit(1);
}