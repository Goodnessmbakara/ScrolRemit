const { ethers } = require('ethers');
require('dotenv').config();

const MOCK_USDC_ADDRESS = '0x775b594496D7365C5Be22B8bd5Cd6188a995c1d9';
const MOCK_USDC_ABI = [
  'function mint() external',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function main() {
  console.log('💰 Minting test mUSDC tokens...\n');

  const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const address = await wallet.getAddress();
  
  console.log(`Wallet: ${address}`);

  const mockUSDC = new ethers.Contract(MOCK_USDC_ADDRESS, MOCK_USDC_ABI, wallet);

  // Check current balance
  const balanceBefore = await mockUSDC.balanceOf(address);
  console.log(`Balance before: ${ethers.formatUnits(balanceBefore, 6)} mUSDC\n`);

  // Mint tokens
  console.log('🔄 Calling mint() function...');
  const tx = await mockUSDC.mint();
  console.log(`Transaction: ${tx.hash}`);
  console.log('Waiting for confirmation...\n');
  
  await tx.wait();

  // Check new balance
  const balanceAfter = await mockUSDC.balanceOf(address);
  console.log(`✅ Mint successful!`);
  console.log(`Balance after: ${ethers.formatUnits(balanceAfter, 6)} mUSDC`);
  console.log(`Minted: ${ethers.formatUnits(balanceAfter - balanceBefore, 6)} mUSDC\n`);
  
  console.log('💡 Note: You can mint 1000 mUSDC once every 24 hours per address.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
