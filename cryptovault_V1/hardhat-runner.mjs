// hardhat-runner.mjs
import { spawnSync } from 'child_process';

const args = process.argv.slice(2);
const scriptPath = args[0];
const hardhatArgs = args.slice(1);

console.log(`Exécution de: npx hardhat run ${scriptPath} --config hardhat.config.cjs ${hardhatArgs.join(' ')}`);

const result = spawnSync('npx', ['hardhat', 'run', scriptPath, '--config', 'hardhat.config.cjs', ...hardhatArgs], {
  stdio: 'inherit',
  shell: true
});

process.exit(result.status);