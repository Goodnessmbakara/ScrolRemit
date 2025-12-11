const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log('📦 Compiling ProfileRegistry contract...\n');

  // Read the contract source code
  const contractPath = path.join(__dirname, '../contracts/ProfileRegistry.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  // Compile the contract
  const input = {
    language: 'Solidity',
    sources: {
      'ProfileRegistry.sol': {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for compilation errors
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('❌ Compilation errors:');
      errors.forEach(err => console.error(err.formattedMessage));
      process.exit(1);
    }
  }

  console.log('✅ Compilation successful!\n');

  // Extract ABI and bytecode
  const compiledContract = output.contracts['ProfileRegistry.sol']['ProfileRegistry'];
  const abi = compiledContract.abi;
  const bytecode = compiledContract.evm.bytecode.object;

  // Connect to Scroll Sepolia
  console.log('🔗 Connecting to Scroll Sepolia...\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const deployer = await wallet.getAddress();
  
  console.log(`Deployer address: ${deployer}`);
  
  // Check balance
  const balance = await provider.getBalance(deployer);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error('❌ Deployer wallet has no funds. Get Scroll Sepolia ETH from: https://sepolia.scroll.io/faucet');
    process.exit(1);
  }

  // Deploy the contract
  console.log('🚀 Deploying ProfileRegistry contract...\n');
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log(`⏳ Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log('Waiting for confirmation...\n');
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('✅ ProfileRegistry deployed successfully!\n');
  console.log('═'.repeat(60));
  console.log(`📍 Contract Address: ${address}`);
  console.log('═'.repeat(60));
  console.log('\n📝 Next steps:');
  console.log('\n1. Add this to your main .env file:');
  console.log(`   VITE_PROFILE_REGISTRY_ADDRESS=${address}`);
  console.log('\n2. Verify on Scrollscan (optional):');
  console.log(`   https://sepolia.scrollscan.com/address/${address}`);
  console.log('\n3. Restart your dev server to use the deployed contract\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });
