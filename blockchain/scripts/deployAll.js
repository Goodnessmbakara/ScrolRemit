const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

// Find imports for OpenZeppelin contracts
function findImports(importPath) {
  try {
    const nodePath = path.join(__dirname, '../node_modules', importPath);
    if (fs.existsSync(nodePath)) {
      return {
        contents: fs.readFileSync(nodePath, 'utf8')
      };
    }
  } catch (e) {
    return { error: 'File not found: ' + importPath };
  }
  return { error: 'File not found: ' + importPath };
}

async function compileContract(contractName) {
  console.log(`📦 Compiling ${contractName}...\n`);

  const contractPath = path.join(__dirname, `../contracts/${contractName}.sol`);
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: {
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

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error(`❌ Compilation errors for ${contractName}:`);
      errors.forEach(err => console.error(err.formattedMessage));
      throw new Error('Compilation failed');
    }
  }

  console.log(`✅ ${contractName} compiled successfully!\n`);

  const contract = output.contracts[`${contractName}.sol`][contractName];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

async function main() {
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
  
  const balance = await provider.getBalance(deployer);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error('❌ Deployer wallet has no funds');
    process.exit(1);
  }

  const deployedContracts = {};

  // ============ Deploy MockUSDC ============
  console.log('🚀 Deploying MockUSDC...\n');
  
  const mockUSDC = await compileContract('MockUSDC');
  const usdcFactory = new ethers.ContractFactory(mockUSDC.abi, mockUSDC.bytecode, wallet);
  const usdcContract = await usdcFactory.deploy();
  
  console.log(`⏳ Transaction: ${usdcContract.deploymentTransaction().hash}`);
  console.log('Waiting for confirmation...\n');
  
  await usdcContract.waitForDeployment();
  const usdcAddress = await usdcContract.getAddress();
  deployedContracts.mockUSDC = usdcAddress;

  console.log(`✅ MockUSDC deployed: ${usdcAddress}\n`);

  // ============ Deploy StreamingPayment ============
  console.log('🚀 Deploying StreamingPayment...\n');
  
  const streamingPayment = await compileContract('StreamingPayment');
  const streamFactory = new ethers.ContractFactory(
    streamingPayment.abi,
    streamingPayment.bytecode,
    wallet
  );
  
  // Pass MockUSDC address as constructor argument
  const streamContract = await streamFactory.deploy(usdcAddress);
  
  console.log(`⏳ Transaction: ${streamContract.deploymentTransaction().hash}`);
  console.log('Waiting for confirmation...\n');
  
  await streamContract.waitForDeployment();
  const streamAddress = await streamContract.getAddress();
  deployedContracts.streamingPayment = streamAddress;

  console.log(`✅ StreamingPayment deployed: ${streamAddress}\n`);

  // ============ Summary ============
  console.log('═'.repeat(70));
  console.log('🎉 All Contracts Deployed Successfully!');
  console.log('═'.repeat(70));
  console.log(`\n📍 MockUSDC: ${usdcAddress}`);
  console.log(`📍 StreamingPayment: ${streamAddress}\n`);
  
  console.log('📝 Next steps:\n');
  console.log('1. Add these to your main .env file:');
  console.log(`   VITE_MOCK_USDC_ADDRESS=${usdcAddress}`);
  console.log(`   VITE_STREAMING_CONTRACT_ADDRESS=${streamAddress}\n`);
  
  console.log('2. Verify on Scrollscan:');
  console.log(`   MockUSDC: https://sepolia.scrollscan.com/address/${usdcAddress}`);
  console.log(`   StreamingPayment: https://sepolia.scrollscan.com/address/${streamAddress}\n`);
  
  console.log('3. Test the faucet:');
  console.log(`   - Mint test USDC by calling mint() on MockUSDC`);
  console.log(`   - You can mint 1000 mUSDC once per day per address\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error);
    process.exit(1);
  });
