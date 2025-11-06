const { ethers, upgrades } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();
  console.log("Admin Wallet Address", admin.address);

  const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");

  const adminBalanceBefore = ethers.formatEther(
    await provider.getBalance(admin.address)
  );
  console.log("Admin balance before", adminBalanceBefore, "Matic");
  const Token = await ethers.getContractFactory("Token");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");

  //deploy token
  const tokenContract = await upgrades.deployProxy(
    Token,
    [admin.address, ""],
    {
      initializer: "initialize",
    },
    { kind: "uups" }
  );
    await tokenContract.waitForDeployment();
  console.log(
    "tokenContract Token deployed at",
    tokenContract.target
  );

  const nftMarketplaceContract = await upgrades.deployProxy(
    NFTMarketplace,
    [
      admin.address,
      tokenContract.target,
      "0x0000000000000000000000000000000000000000",
    ],
    {
      initializer: "initialize",
    },
    { kind: "uups" }
  );
  await tokenContract.waitForDeployment();
  console.log(
    "nftMarketplaceContract Token deployed at",
    nftMarketplaceContract.target
  );

  //setting marketplace address in token contract
  await tokenContract.setMarketplaceContractAddress(
    nftMarketplaceContract.target
  );

  const adminBalanceAfter = ethers.formatEther(
    await provider.getBalance(admin.address)
  );
  console.log("Admin balance after", adminBalanceAfter, "Matic");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

