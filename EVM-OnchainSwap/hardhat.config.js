require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config({ path: "./.env" });
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
console.log();
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat:{},
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/RClkjHJ4zED8c-HUKW1CSNOL34aCx6V1`,
      chainId: 80002,
      accounts: [`0x${process.env.PRIVATE_KEY_AAYUSH}`],
    },
    holesky:{
      url: `https://eth-holesky.g.alchemy.com/v2/RClkjHJ4zED8c-HUKW1CSNOL34aCx6V1`,
      chainId: 17000,
      accounts: [`0x${process.env.PRIVATE_KEY_AAYUSH}`],
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGON_API_KEY,
      holesky: process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
};
