import { ethers } from 'ethers';

const BEP721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const BEP1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const ERC721_INTERFACE_ID = '0x80ac58cd';
const ERC1155_INTERFACE_ID = '0xd9b67a26';

async function fetchBEP721NFTs(contract, ownerAddress) {
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
          standard: 'BEP-721',
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

async function fetchBEP1155NFTs(contract, ownerAddress) {
  const nfts = [];
  
  try {
    const supports1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
    
    if (supports1155) {
      // BEP-1155 enumeration requires known token IDs
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

export async function fetchBSCNFTs(rpcUrl, ownerAddress, contractAddresses = []) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const allNFTs = [];
  
  if (contractAddresses.length > 0) {
    for (const contractAddress of contractAddresses) {
      try {
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
        // Skip invalid contracts
      }
    }
  }
  
  return allNFTs;
}

async function main() {
  const args = process.argv.slice(2);
  
  const defaultBSCRPC = 'https://bsc-dataseed1.binance.org';
  
  const rpcUrl = args[0] || defaultBSCRPC;
  const ownerAddress = args[1] || '0x0000000000000000000000000000000000000000';
  const contractAddresses = args.slice(2) || [];
  
  if (ownerAddress === '0x0000000000000000000000000000000000000000') {
    console.log('Usage: node fetchBSCNFTs.js <rpcUrl> <ownerAddress> [contractAddress1] [contractAddress2] ...');
    console.log('Example: node fetchBSCNFTs.js https://bsc-dataseed1.binance.org 0x1234...5678 0xContract1 0xContract2');
    return;
  }
  
  const nfts = await fetchBSCNFTs(rpcUrl, ownerAddress, contractAddresses);
  
  console.log(`Found ${nfts.length} NFT(s)`);
  nfts.forEach((nft, index) => {
    console.log(`${index + 1}. ${nft.standard} - Token ID: ${nft.tokenId}`);
    console.log(`   Contract: ${nft.contractAddress}`);
    console.log(`   URI: ${nft.tokenURI}`);
  });
  
  return nfts;
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('fetchBSCNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}
