async function main() {
  const [deployer] = await ethers.getSigners();
  // both token decimal is 9 and initial supply is 100 million
  const initialSupply = 100000000;

  DexLiquidity = await ethers.getContractFactory("DexLiquidity");
  // Token = await ethers.getContractFactory("MyERC20Token");
  dexLiquidity = await DexLiquidity.deploy();
  // tokenA = await Token.deploy("MyTokenA", "MTA", initialSupply);
  // tokenB = await Token.deploy("MyTokenB", "MTB", initialSupply);
  // tokenC = await Token.deploy("MyTokenC", "MTC", initialSupply);

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("liquidity contract address:", dexLiquidity.address);
  // console.log("TokenA address:", tokenA.address);
  // console.log("TokenB address:", tokenB.address);
  // console.log("TokenC address:", tokenC.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// liquidity contract address: 0xB140fdaE46f00D2e89da5c28b4ef8ec287BC9a71
// TokenA address: 0xbf71abAF248b635048289528c7F901BA6080D982
// TokenB address: 0xaCF19e2B7BD57cFfaDdC3F6d61B8021862e156f6
// TokenC address: 0x41F4Ebb8C57895e2BeEB539f0d7bb75945132C0c

// npx hardhat verify --network sepolia 0x41F4Ebb8C57895e2BeEB539f0d7bb75945132C0c "MyTokenC" "MTC" "100000000"
// npx hardhat verify --network polygonAmoy 0x8d161394c6799d0f14773C1de9F3A0eCbD078929
