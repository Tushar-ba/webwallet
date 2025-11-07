import { HardhatUserConfig, vars } from "hardhat/config";
import "@layerzerolabs/toolbox-hardhat";
import { EndpointId } from '@layerzerolabs/lz-definitions';
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";


const accounts = vars.get("ADMIN_WALLET_PRIVATE_KEY", "");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // Enable IR optimizer to fix "Stack too deep" error
    }
  },
  namedAccounts: {
    deployer: {
      default: 0, // First account as deployer
    },
  },
  networks: {
    // Existing testnets
    // 'arbitrum-sepolia-testnet': {
    //     eid: EndpointId.ARBSEP_V2_TESTNET,
    //     url: 'https://arbitrum-sepolia.gateway.tenderly.co',
    //     accounts: accounts ? [accounts] : [],
    // },
    'holesky': {
        eid: EndpointId.HOLESKY_V2_TESTNET,
        url: 'https://holesky.drpc.org',
        accounts: accounts ? [accounts] : [],
    },
    'avalanche-fuji-testnet': {
        eid: EndpointId.AVALANCHE_V2_TESTNET,
        url: 'https://avalanche-fuji.drpc.org',
        accounts: accounts ? [accounts] : [],
    },
    // 'optimism-sepolia-testnet': {
    //     eid: EndpointId.OPTSEP_V2_TESTNET,
    //     url: 'https://optimism-sepolia.gateway.tenderly.co',
    //     accounts: accounts ? [accounts] : [],
    // },
    // 'ethereum-sepolia': {
    //     eid: EndpointId.SEPOLIA_V2_TESTNET,
    //     url: vars.get("SEPOLIA_RPC_URL", "https://eth-sepolia.g.alchemy.com/v2/Ln0Aa5Ea0iyVV0mh6RpyT"),
    //     accounts: accounts ? [accounts] : [],
    // },
    // 'bsc-testnet': {
    //     eid: EndpointId.BSC_V2_TESTNET,
    //     url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    //     accounts: accounts ? [accounts] : [],
    // },
    // 'base-sepolia': {
    //     eid: EndpointId.BASESEP_V2_TESTNET,
    //     url: 'https://sepolia.base.org',
    //     accounts: accounts ? [accounts] : [],
    // },
    // 'polygon-amoy': {
    //     eid: EndpointId.AMOY_V2_TESTNET,
    //     url: 'https://rpc-amoy.polygon.technology',
    //     accounts: accounts ? [accounts] : [],
    // },
  },
  etherscan: {
    // Your single API key for all supported networks
    apiKey: {
    holesky: "K675NHYZWXFM8BBCRA6GG8C4AIVE4TF7JK",
    avalancheFujiTestnet: "K675NHYZWXFM8BBCRA6GG8C4AIVE4TF7JK",
  },
    // Add the custom chain definition for Optimism Sepolia
    customChains: [
      {
        network: "optimism-sepolia-testnet",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
    ],
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
  }
};

export default config;