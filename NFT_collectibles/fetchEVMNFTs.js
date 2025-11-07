import { ethers } from 'ethers';

const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const ERC721_INTERFACE_ID = '0x80ac58cd';
const ERC1155_INTERFACE_ID = '0xd9b67a26';

async function fetchERC721NFTs(contract, ownerAddress) {
  const nfts = [];
  
  try {
    const balance = await contract.balanceOf(ownerAddress);
    const balanceNumber = Number(balance);
    
    if (balanceNumber === 0) {
      return nfts;
    }

    for (let i = 0; i < balanceNumber; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
        const tokenURI = await contract.tokenURI(tokenId);
        
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI: tokenURI,
          standard: 'ERC-721',
          contractAddress: await contract.getAddress()
        });
      } catch (error) {
        // Skip invalid tokens
      }
    }
  } catch (error) {
    // Return empty array on error
  }
  
  return nfts;
}

async function fetchERC1155NFTs(contract, ownerAddress) {
  const nfts = [];
  
  try {
    const supports1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
    
    if (supports1155) {
      // ERC-1155 enumeration requires known token IDs
    }
  } catch (error) {
    // Return empty array on error
  }
  
  return nfts;
}

async function detectNFTStandard(contract) {
  try {
    const supports721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
    if (supports721) {
      return 'ERC-721';
    }
    
    const supports1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
    if (supports1155) {
      return 'ERC-1155';
    }
  } catch (error) {
    return null;
  }
  
  return null;
}

export async function fetchEVMNFTs(rpcUrl, ownerAddress, contractAddresses = []) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const allNFTs = [];
  
  if (contractAddresses.length > 0) {
    for (const contractAddress of contractAddresses) {
      try {
        const erc721Contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
        const standard = await detectNFTStandard(erc721Contract);
        
        if (standard === 'ERC-721') {
          const nfts = await fetchERC721NFTs(erc721Contract, ownerAddress);
          allNFTs.push(...nfts);
        } else if (standard === 'ERC-1155') {
          const erc1155Contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
          const nfts = await fetchERC1155NFTs(erc1155Contract, ownerAddress);
          allNFTs.push(...nfts);
        }
      } catch (error) {
        // Skip invalid contracts
      }
    }
  }
  
  return allNFTs;
}

async function main() {
  const args = process.argv.slice(2);
  
  const defaultRPCs = {
    ethereum: 'https://eth.llamarpc.com',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    base: 'https://mainnet.base.org',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc'
  };
  
  const rpcUrl = args[0] || defaultRPCs.ethereum;
  const ownerAddress = args[1] || '0x0000000000000000000000000000000000000000';
  const contractAddresses = args.slice(2) || [];
  
  if (ownerAddress === '0x0000000000000000000000000000000000000000') {
    console.log('Usage: node fetchEVMNFTs.js <rpcUrl> <ownerAddress> [contractAddress1] [contractAddress2] ...');
    console.log('Example: node fetchEVMNFTs.js https://eth.llamarpc.com 0x1234...5678 0xContract1 0xContract2');
    return;
  }
  
  const nfts = await fetchEVMNFTs(rpcUrl, ownerAddress, contractAddresses);
  
  console.log(`Found ${nfts.length} NFT(s)`);
  nfts.forEach((nft, index) => {
    console.log(`${index + 1}. ${nft.standard} - Token ID: ${nft.tokenId}`);
    console.log(`   Contract: ${nft.contractAddress}`);
    console.log(`   URI: ${nft.tokenURI}`);
  });
  
  return nfts;
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('fetchEVMNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}
