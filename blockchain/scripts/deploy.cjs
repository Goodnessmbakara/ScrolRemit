const hre = require("hardhat");

async function main() {
  console.log("Deploying ProfileRegistry contract to Scroll Sepolia...");

  // Get the contract factory
  const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
  
  // Deploy the contract
  const profileRegistry = await ProfileRegistry.deploy();
  
  // Wait for deployment to complete
  await profileRegistry.waitForDeployment();
  
  const address = await profileRegistry.getAddress();
  
  console.log(`✅ ProfileRegistry deployed to: ${address}`);
  console.log(`\nAdd this to your .env file:`);
  console.log(`VITE_PROFILE_REGISTRY_ADDRESS=${address}`);
  
  // Verify on Scrollscan (optional)
  console.log(`\nTo verify on Scrollscan, run:`);
  console.log(`npx hardhat verify --network scrollSepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
