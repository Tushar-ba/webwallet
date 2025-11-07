const { ethers, upgrades } = require("hardhat");

/**
 * @notice Upgrades the StakingPool contract to a new implementation
 * @param proxyAddress The address of the proxy contract
 */
async function main() {
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "";

  if (!PROXY_ADDRESS) {
    throw new Error("Please set PROXY_ADDRESS environment variable");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contracts with account:", deployer.address);

  const StakingPool = await ethers.getContractFactory("StakingPool");

  console.log("Upgrading StakingPool at:", PROXY_ADDRESS);
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, StakingPool);

  console.log("StakingPool upgraded!");
  console.log(
    "New implementation address:",
    await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

