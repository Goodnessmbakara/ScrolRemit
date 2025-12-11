const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

const SCROLLSCAN_API_URL = 'https://api-sepolia.scrollscan.com/api';

// Contract details
const contracts = [
  {
    name: 'ProfileRegistry',
    address: '0x7CCD52ACcB065c63D7Df21d57ECD97CB4A157374',
    constructorArgs: '' // No constructor args
  },
  {
    name: 'MockUSDC',
    address: '0x775b594496D7365C5Be22B8bd5Cd6188a995c1d9',
    constructorArgs: '' // No constructor args
  },
  {
    name: 'StreamingPayment',
    address: '0xDdc49E1bA14E64c824B7eDF8924572618fe100AF',
    constructorArgs: '000000000000000000000000775b594496d7365c5be22b8bd5cd6188a995c1d9' // MockUSDC address (padded to 32 bytes)
  }
];

async function getSourceCode(contractName) {
  const contractPath = path.join(__dirname, `../contracts/${contractName}.sol`);
  let source = fs.readFileSync(contractPath, 'utf8');
  
  // For contracts with OpenZeppelin imports, we need to flatten them
  if (source.includes('@openzeppelin')) {
    console.log(`Note: ${contractName} contains OpenZeppelin imports.`);
    console.log(`For verification, you may need to use the 'Standard JSON Input' method or flatten the contract.\n`);
    
    // Read and inline OpenZeppelin contracts (simple approach for common imports)
    const imports = source.match(/@openzeppelin\/contracts\/[^"']+/g) || [];
    for (const importPath of imports) {
      const fullPath = path.join(__dirname, '../node_modules', importPath + '.sol');
      if (fs.existsSync(fullPath)) {
        const importedSource = fs.readFileSync(fullPath, 'utf8');
        // This is a simplified flattening - in production, use a proper flattener
        source = importedSource + '\n' + source;
      }
    }
  }

  return source;
}

async function verifyContract(contract) {
  console.log(`\n🔍 Verifying ${contract.name} on Scrollscan...`);
  console.log(`Address: ${contract.address}`);

  const sourceCode = await getSourceCode(contract.name);

  const postData = querystring.stringify({
    apikey: process.env.SCROLLSCAN_API_KEY || 'YourApiKeyToken',
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contract.address,
    sourceCode: sourceCode,
    codeformat: 'solidity-single-file',
    contractname: contract.name,
    compilerversion: 'v0.8.20+commit.a1b79de6', // Solc version
    optimizationUsed: '1',
    runs: '200',
    constructorArguements: contract.constructorArgs,
    evmversion: 'default',
    licenseType: '3' // MIT license
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-sepolia.scrollscan.com',
      path: '/api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('═'.repeat(70));
  console.log('📋 Smart Contract Verification on Scrollscan');
  console.log('═'.repeat(70));

  if (!process.env.SCROLLSCAN_API_KEY) {
    console.log('\n⚠️  No SCROLLSCAN_API_KEY found in .env file');
    console.log('You can get one from: https://scrollscan.com/myapikey');
    console.log('\nAlternatively, you can verify manually:');
  }

  for (const contract of contracts) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Contract: ${contract.name}`);
    console.log(`Address: ${contract.address}`);
    console.log(`Browser: https://sepolia.scrollscan.com/address/${contract.address}#code`);
    
    if (process.env.SCROLLSCAN_API_KEY) {
      try {
        const result = await verifyContract(contract);
        if (result.status === '1') {
          console.log(`✅ Verification submitted! GUID: ${result.result}`);
        } else {
          console.log(`❌ Verification failed: ${result.result}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log('Try manual verification using the browser link above.');
      }
    } else {
      console.log('\n📝 To verify manually:');
      console.log(`1. Visit the browser link above`);
      console.log(`2. Click "Contract" tab`);
      console.log(`3. Click "Verify and Publish"`);
      console.log(`4. Select "Solidity (Single file)"`);
      console.log(`5. Compiler: v0.8.20+commit.a1b79de6`);
      console.log(`6. Optimization: Yes, runs: 200`);
      console.log(`7. Paste source code from contracts/${contract.name}.sol`);
      if (contract.constructorArgs) {
        console.log(`8. Constructor Arguments: ${contract.constructorArgs}`);
      }
    }
  }

  console.log(`\n${'═'.repeat(70)}\n`);
  console.log('💡 Tips:');
  console.log('- For contracts with OpenZeppelin imports, use "Standard JSON Input" method');
  console.log('- Or use a contract flattener tool before verification');
  console.log('- Visit https://scrollscan.com/myapikey to get an API key for automated verification\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
