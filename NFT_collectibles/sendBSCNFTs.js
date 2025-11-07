import { ethers } from 'ethers';

const BEP721_ABI = [
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const BEP1155_ABI = [
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address[] to, uint256[] ids, uint256[] amounts, bytes data)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

const ERC721_INTERFACE_ID = '0x80ac58cd';
const ERC1155_INTERFACE_ID = '0xd9b67a26';

async function sendBEP721(wallet, contractAddress, toAddress, tokenId, useSafeTransfer = true) {
  const contract = new ethers.Contract(contractAddress, BEP721_ABI, wallet);
  
  const owner = await contract.ownerOf(tokenId);
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`Token ${tokenId} is not owned by ${wallet.address}`);
  }
  
  const approved = await contract.getApproved(tokenId);
  const isApproved = approved.toLowerCase() === wallet.address.toLowerCase();
  
  if (!isApproved) {
    const approveTx = await contract.approve(wallet.address, tokenId);
    await approveTx.wait();
  }
  
  let tx;
  if (useSafeTransfer) {
    tx = await contract.safeTransferFrom(wallet.address, toAddress, tokenId);
  } else {
    tx = await contract.transferFrom(wallet.address, toAddress, tokenId);
  }
  
  const receipt = await tx.wait();
  return receipt;
}

async function sendBEP1155(wallet, contractAddress, toAddress, tokenId, amount = 1) {
  const contract = new ethers.Contract(contractAddress, BEP1155_ABI, wallet);
  
  const balance = await contract.balanceOf(wallet.address, tokenId);
  if (BigInt(balance) < BigInt(amount)) {
    throw new Error(`Insufficient balance. Owned: ${balance}, Required: ${amount}`);
  }
  
  const isApproved = await contract.isApprovedForAll(wallet.address, wallet.address);
  
  if (!isApproved) {
    const approveTx = await contract.setApprovalForAll(wallet.address, true);
    await approveTx.wait();
  }
  
  const tx = await contract.safeTransferFrom(
    wallet.address,
    toAddress,
    tokenId,
    amount,
    '0x'
  );
  
  const receipt = await tx.wait();
  return receipt;
}

async function detectAndSend(wallet, contractAddress, toAddress, tokenId, amount = 1) {
  try {
    const bep721Contract = new ethers.Contract(contractAddress, BEP721_ABI, wallet);
    const supports721 = await bep721Contract.supportsInterface(ERC721_INTERFACE_ID);
    
    if (supports721) {
      return await sendBEP721(wallet, contractAddress, toAddress, tokenId);
    }
  } catch (error) {
    // Not BEP-721, try BEP-1155
  }
  
  try {
    const bep1155Contract = new ethers.Contract(contractAddress, BEP1155_ABI, wallet);
    const supports1155 = await bep1155Contract.supportsInterface(ERC1155_INTERFACE_ID);
    
    if (supports1155) {
      return await sendBEP1155(wallet, contractAddress, toAddress, tokenId, amount);
    }
  } catch (error) {
    throw new Error('Contract does not support BEP-721 or BEP-1155 standards');
  }
  
  throw new Error('Could not detect NFT standard');
}

export async function sendBSCNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId, amount = 1) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return await detectAndSend(wallet, contractAddress, toAddress, tokenId, amount);
}

async function main() {
  const args = process.argv.slice(2);
  
  const defaultBSCRPC = 'https://bsc-dataseed1.binance.org';
  
  const rpcUrl = args[0] || defaultBSCRPC;
  const privateKey = args[1] || '';
  const contractAddress = args[2] || '';
  const toAddress = args[3] || '';
  const tokenId = args[4] || '';
  const amount = args[5] ? parseInt(args[5]) : 1;
  
  if (!privateKey || !contractAddress || !toAddress || !tokenId) {
    console.log('Usage: node sendBSCNFTs.js <rpcUrl> <privateKey> <contractAddress> <toAddress> <tokenId> [amount]');
    console.log('Example: node sendBSCNFTs.js https://bsc-dataseed1.binance.org 0xPrivateKey 0xContract 0xRecipient 123');
    return;
  }
  
  try {
    const receipt = await sendBSCNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId, amount);
    console.log('NFT sent successfully. Transaction hash:', receipt.hash);
  } catch (error) {
    console.error('Error sending NFT:', error.message);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('sendBSCNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}
