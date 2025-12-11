const { ethers } = require('ethers');
require('dotenv').config();

const SCROLL_RPC = 'https://sepolia-rpc.scroll.io/';
const MIN_BALANCE = ethers.parseEther('0.0005'); // 0.0005 ETH minimum (very small)
const FUND_AMOUNT = ethers.parseEther('0.002'); // Send 0.002 ETH (enough for ~20 transactions)

/**
 * Check if user wallet has sufficient gas and fund if necessary
 * @param {string} userAddress - User's wallet address to check/fund
 */
async function checkAndFundWallet(userAddress) {
  try {
    console.log(`Checking balance for ${userAddress}...`);
    
    const provider = new ethers.JsonRpcProvider(SCROLL_RPC);
    const balance = await provider.getBalance(userAddress);
    
    console.log(`Current balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < MIN_BALANCE) {
      console.log('⚠️ Insufficient balance. Funding wallet...');
      
      // Get admin wallet from environment
      const adminPrivateKey = process.env.ADMIN_FUNDING_PRIVATE_KEY;
      if (!adminPrivateKey) {
        throw new Error('ADMIN_FUNDING_PRIVATE_KEY not set in environment');
      }
      
      const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
      const adminBalance = await provider.getBalance(adminWallet.address);
      
      console.log(`Admin wallet: ${adminWallet.address}`);
      console.log(`Admin balance: ${ethers.formatEther(adminBalance)} ETH`);
      
      if (adminBalance < FUND_AMOUNT) {
        throw new Error('Admin wallet has insufficient funds');
      }
      
      // Send ETH to user
      const tx = await adminWallet.sendTransaction({
        to: userAddress,
        value: FUND_AMOUNT
      });
      
      console.log(`Funding transaction sent: ${tx.hash}`);
      await tx.wait();
      
      const newBalance = await provider.getBalance(userAddress);
      console.log(`✅ Wallet funded! New balance: ${ethers.formatEther(newBalance)} ETH`);
      
      return {
        funded: true,
        txHash: tx.hash,
        amount: ethers.formatEther(FUND_AMOUNT)
      };
    } else {
      console.log('✅ Wallet has sufficient balance');
      return {
        funded: false,
        message: 'Wallet already has sufficient balance'
      };
    }
  } catch (error) {
    console.error('Error checking/funding wallet:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const userAddress = process.argv[2];
  
  if (!userAddress) {
    console.error('Usage: node fundWallet.js <user_address>');
    process.exit(1);
  }
  
  checkAndFundWallet(userAddress)
    .then(result => {
      console.log('\n✅ Done:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { checkAndFundWallet };
