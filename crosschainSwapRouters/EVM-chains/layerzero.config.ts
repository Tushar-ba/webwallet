import { EndpointId } from '@layerzerolabs/lz-definitions';
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities';
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools';
import { OAppEnforcedOption, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat';

// Define CrossChainRouter contract deployments for each chain
// Note: Update addresses after deploying contracts to each network
const sepoliaRouter: OmniPointHardhat = {
  eid: EndpointId.SEPOLIA_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual Sepolia address
};

const polygonAmoyRouter: OmniPointHardhat = {
  eid: EndpointId.AMOY_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual Polygon Amoy address
};

const bscRouter: OmniPointHardhat = {
  eid: EndpointId.BSC_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual BSC address
};

const arbitrumRouter: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual Arbitrum address
};

const baseRouter: OmniPointHardhat = {
  eid: EndpointId.BASESEP_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual Base address
};

const avaxRouter: OmniPointHardhat = {
  eid: EndpointId.AVALANCHE_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual AVAX address
};

const cronosRouter: OmniPointHardhat = {
  eid: EndpointId.CRONOSEVM_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual Cronos address
};

const celoRouter: OmniPointHardhat = {
  eid: EndpointId.CELO_V2_TESTNET,
  contractName: 'CrossChainRouter',
  address: '0x0000000000000000000000000000000000000000', // Update with actual Celo address
};

// Configure enforced options for CrossChainRouter messages (msg type 1)
const ROUTER_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
  {
    msgType: 1, // CrossChain swap message
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 500000, // Gas for CrossChainRouter _lzReceive (includes DEX swap)
    value: 0,
  },
];

// Define two-way pathways for CrossChainRouter between all chains
// Creating all pair combinations for full mesh connectivity
const routerPathways: TwoWayConfig[] = [
  // Sepolia connections
  [sepoliaRouter, polygonAmoyRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [sepoliaRouter, bscRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [sepoliaRouter, arbitrumRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [sepoliaRouter, baseRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [sepoliaRouter, avaxRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [sepoliaRouter, cronosRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [sepoliaRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  
  // Polygon Amoy connections (excluding Sepolia, already connected)
  [polygonAmoyRouter, bscRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [polygonAmoyRouter, arbitrumRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [polygonAmoyRouter, baseRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [polygonAmoyRouter, avaxRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [polygonAmoyRouter, cronosRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [polygonAmoyRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  
  // BSC connections (excluding Sepolia and Polygon Amoy, already connected)
  [bscRouter, arbitrumRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [bscRouter, baseRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [bscRouter, avaxRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [bscRouter, cronosRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [bscRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  
  // Arbitrum connections (excluding Sepolia, Polygon Amoy, and BSC, already connected)
  [arbitrumRouter, baseRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [arbitrumRouter, avaxRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [arbitrumRouter, cronosRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [arbitrumRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  
  // Base connections (excluding Sepolia, Polygon Amoy, BSC, and Arbitrum, already connected)
  [baseRouter, avaxRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [baseRouter, cronosRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [baseRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  
  // AVAX connections (excluding Sepolia, Polygon Amoy, BSC, Arbitrum, and Base, already connected)
  [avaxRouter, cronosRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  [avaxRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
  
  // Cronos <-> Celo connection (last pair)
  [cronosRouter, celoRouter, [['LayerZero Labs'], []], [1, 1], [ROUTER_ENFORCED_OPTIONS, ROUTER_ENFORCED_OPTIONS]],
];

export default async function () {
  // Generate connections config from all pathways
  const connections = await generateConnectionsConfig(routerPathways);
  
  return {
    contracts: [
      // Router contracts for all chains
      { contract: sepoliaRouter },
      { contract: polygonAmoyRouter },
      { contract: bscRouter },
      { contract: arbitrumRouter },
      { contract: baseRouter },
      { contract: avaxRouter },
      { contract: cronosRouter },
      { contract: celoRouter },
    ],
    connections,
  };
}
