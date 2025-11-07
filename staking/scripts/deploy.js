const { ethers, upgrades } = require("hardhat");

/**
 * @notice Deploys the StakingPool contract with UUPS upgradeable proxy
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy StakingPool with upgradeable proxy
  console.log("\nDeploying StakingPool...");
  const StakingPool = await ethers.getContractFactory("StakingPool");

  const stakingPool = await upgrades.deployProxy(
    StakingPool,
    [deployer.address], // initialOwner
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();

  console.log("StakingPool deployed to:", stakingPoolAddress);
  console.log(
    "Implementation address:",
    await upgrades.erc1967.getImplementationAddress(stakingPoolAddress)
  );

  // Example: Create a test pool (optional - remove in production)
  // Uncomment and modify as needed:
  /*
  console.log("\nCreating example pool...");
  const tokenAddress = "0x..."; // Replace with actual token address
  const rewardTokenAddress = "0x..."; // Replace with actual reward token address
  const apy = 1000; // 10% APY in basis points
  const lockPeriod = 30 * 24 * 60 * 60; // 30 days in seconds
  const minStakeAmount = ethers.parseEther("100"); // Minimum 100 tokens
  const maxStakeAmount = ethers.parseEther("10000"); // Maximum 10000 tokens

  const tx = await stakingPool.createPool(
    tokenAddress,
    rewardTokenAddress,
    apy,
    lockPeriod,
    minStakeAmount,
    maxStakeAmount
  );
  await tx.wait();
  console.log("Pool created! Pool ID: 1");
  */

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

