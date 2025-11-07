import { ethers } from 'ethers';

/**
 * BEP-721 ABI (compatible with ERC-721)
 */
const BEP721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

/**
 * BEP-1155 ABI (compatible with ERC-1155)
 */
const BEP1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

/**
 * ERC-721 Interface ID (BEP-721 uses the same)
 */
const ERC721_INTERFACE_ID = '0x80ac58cd';

/**
 * ERC-1155 Interface ID (BEP-1155 uses the same)
 */
const ERC1155_INTERFACE_ID = '0xd9b67a26';

/**
 * Fetch BEP-721 NFTs owned by an address
 * @param {ethers.Contract} contract - BEP-721 contract instance
 * @param {string} ownerAddress - Address to check
 * @returns {Promise<Array>} Array of NFT objects
 */
async function fetchBEP721NFTs(contract, ownerAddress) {
  const nfts = [];
  
  try {
    const balance = await contract.balanceOf(ownerAddress);
    const balanceNumber = Number(balance);
    
    if (balanceNumber === 0) {
      return nfts;
    }

    // Fetch all token IDs owned by the address
    for (let i = 0; i < balanceNumber; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
        const tokenURI = await contract.tokenURI(tokenId);
        
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI: tokenURI,
          standard: 'BEP-721',
          contractAddress: await contract.getAddress()
        });
      } catch (error) {
        console.error(`Error fetching token at index ${i}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error fetching BEP-721 NFTs:', error.message);
  }
  
  return nfts;
}

/**
 * Fetch BEP-1155 NFTs owned by an address
 * @param {ethers.Contract} contract - BEP-1155 contract instance
 * @param {string} ownerAddress - Address to check
 * @returns {Promise<Array>} Array of NFT objects
 */
async function fetchBEP1155NFTs(contract, ownerAddress) {
  const nfts = [];
  
  try {
    // Note: BEP-1155 doesn't have a direct way to enumerate all tokens
    // This is a simplified version that would need token IDs to be known
    const supports1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
    
    if (supports1155) {
      console.log('BEP-1155 contract detected. Token enumeration requires known token IDs.');
    }
  } catch (error) {
    console.error('Error fetching BEP-1155 NFTs:', error.message);
  }
  
  return nfts;
}

/**
 * Check if contract supports BEP-721 or BEP-1155
 * @param {ethers.Contract} contract - Contract instance
 * @returns {Promise<string|null>} Standard type or null
 */
async function detectNFTStandard(contract) {
  try {
    const supports721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
    if (supports721) {
      return 'BEP-721';
    }
    
    const supports1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
    if (supports1155) {
      return 'BEP-1155';
    }
  } catch (error) {
    return null;
  }
  
  return null;
}

/**
 * Fetch all NFTs owned by an address on BSC
 * @param {string} rpcUrl - RPC URL for BSC
 * @param {string} ownerAddress - Address to check
 * @param {Array<string>} contractAddresses - Optional array of contract addresses to check
 * @returns {Promise<Array>} Array of all NFTs
 */
export async function fetchBSCNFTs(rpcUrl, ownerAddress, contractAddresses = []) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const allNFTs = [];
  
  // If contract addresses are provided, check only those
  if (contractAddresses.length > 0) {
    for (const contractAddress of contractAddresses) {
      try {
        // Try BEP-721 first
        const bep721Contract = new ethers.Contract(contractAddress, BEP721_ABI, provider);
        const standard = await detectNFTStandard(bep721Contract);
        
        if (standard === 'BEP-721') {
          const nfts = await fetchBEP721NFTs(bep721Contract, ownerAddress);
          allNFTs.push(...nfts);
        } else if (standard === 'BEP-1155') {
          const bep1155Contract = new ethers.Contract(contractAddress, BEP1155_ABI, provider);
          const nfts = await fetchBEP1155NFTs(bep1155Contract, ownerAddress);
          allNFTs.push(...nfts);
        }
      } catch (error) {
        console.error(`Error checking contract ${contractAddress}:`, error.message);
      }
    }
  } else {
    console.log('Note: Contract addresses not provided. Please provide contract addresses to check.');
    console.log('For automatic discovery, consider using BSCScan API or a subgraph service.');
  }
  
  return allNFTs;
}

/**
 * Main function to run the script
 */
async function main() {
  // Get parameters from command line or use defaults
  const args = process.argv.slice(2);
  
  // Default BSC RPC URL
  const defaultBSCRPC = 'https://bsc-dataseed1.binance.org';
  
  // Example usage
  const rpcUrl = args[0] || defaultBSCRPC;
  const ownerAddress = args[1] || '0x0000000000000000000000000000000000000000';
  const contractAddresses = args.slice(2) || [];
  
  if (ownerAddress === '0x0000000000000000000000000000000000000000') {
    console.log('Usage: node fetchBSCNFTs.js <rpcUrl> <ownerAddress> [contractAddress1] [contractAddress2] ...');
    console.log('\nExample:');
    console.log('  node fetchBSCNFTs.js https://bsc-dataseed1.binance.org 0x1234...5678 0xContract1 0xContract2');
    console.log('\nSupported standards: BEP-721, BEP-1155');
    return;
  }
  
  console.log(`Fetching NFTs for address: ${ownerAddress}`);
  console.log(`Using RPC: ${rpcUrl}`);
  console.log(`Checking ${contractAddresses.length} contract(s)...\n`);
  
  const nfts = await fetchBSCNFTs(rpcUrl, ownerAddress, contractAddresses);
  
  console.log(`\nFound ${nfts.length} NFT(s):\n`);
  nfts.forEach((nft, index) => {
    console.log(`${index + 1}. ${nft.standard} - Token ID: ${nft.tokenId}`);
    console.log(`   Contract: ${nft.contractAddress}`);
    console.log(`   URI: ${nft.tokenURI}\n`);
  });
  
  return nfts;
}

// Run if called directly (check if this file is the main module)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('fetchBSCNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}

