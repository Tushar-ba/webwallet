import { ethers } from 'ethers';

/**
 * BEP-721 ABI for transfer functions (compatible with ERC-721)
 */
const BEP721_ABI = [
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
];

/**
 * BEP-1155 ABI for transfer functions (compatible with ERC-1155)
 */
const BEP1155_ABI = [
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address[] to, uint256[] ids, uint256[] amounts, bytes data)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
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
 * Send BEP-721 NFT
 * @param {ethers.Wallet} wallet - Wallet instance with signer
 * @param {string} contractAddress - NFT contract address
 * @param {string} toAddress - Recipient address
 * @param {string} tokenId - Token ID to transfer
 * @param {boolean} useSafeTransfer - Use safeTransferFrom instead of transferFrom
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
async function sendBEP721(wallet, contractAddress, toAddress, tokenId, useSafeTransfer = true) {
  const contract = new ethers.Contract(contractAddress, BEP721_ABI, wallet);
  
  // Verify ownership
  const owner = await contract.ownerOf(tokenId);
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`Token ${tokenId} is not owned by ${wallet.address}`);
  }
  
  // Check if approval is needed
  const approved = await contract.getApproved(tokenId);
  const isApproved = approved.toLowerCase() === wallet.address.toLowerCase();
  
  if (!isApproved) {
    // Approve the contract to transfer (self-approve for direct transfer)
    console.log('Approving token for transfer...');
    const approveTx = await contract.approve(wallet.address, tokenId);
    await approveTx.wait();
    console.log('Approval confirmed');
  }
  
  // Transfer the NFT
  let tx;
  if (useSafeTransfer) {
    tx = await contract.safeTransferFrom(wallet.address, toAddress, tokenId);
  } else {
    tx = await contract.transferFrom(wallet.address, toAddress, tokenId);
  }
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
  
  return receipt;
}

/**
 * Send BEP-1155 NFT
 * @param {ethers.Wallet} wallet - Wallet instance with signer
 * @param {string} contractAddress - NFT contract address
 * @param {string} toAddress - Recipient address
 * @param {string} tokenId - Token ID to transfer
 * @param {number} amount - Amount to transfer (usually 1 for NFTs)
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
async function sendBEP1155(wallet, contractAddress, toAddress, tokenId, amount = 1) {
  const contract = new ethers.Contract(contractAddress, BEP1155_ABI, wallet);
  
  // Check balance
  const balance = await contract.balanceOf(wallet.address, tokenId);
  if (BigInt(balance) < BigInt(amount)) {
    throw new Error(`Insufficient balance. Owned: ${balance}, Required: ${amount}`);
  }
  
  // Check if approval for all is set
  const isApproved = await contract.isApprovedForAll(wallet.address, wallet.address);
  
  if (!isApproved) {
    // Set approval for all (self-approve for direct transfer)
    console.log('Setting approval for all...');
    const approveTx = await contract.setApprovalForAll(wallet.address, true);
    await approveTx.wait();
    console.log('Approval confirmed');
  }
  
  // Transfer the NFT
  const tx = await contract.safeTransferFrom(
    wallet.address,
    toAddress,
    tokenId,
    amount,
    '0x' // Empty data
  );
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
  
  return receipt;
}

/**
 * Detect NFT standard and send accordingly
 * @param {ethers.Wallet} wallet - Wallet instance with signer
 * @param {string} contractAddress - NFT contract address
 * @param {string} toAddress - Recipient address
 * @param {string} tokenId - Token ID to transfer
 * @param {number} amount - Amount (for BEP-1155, default 1)
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
async function detectAndSend(wallet, contractAddress, toAddress, tokenId, amount = 1) {
  // Try BEP-721 first
  try {
    const bep721Contract = new ethers.Contract(contractAddress, BEP721_ABI, wallet);
    const supports721 = await bep721Contract.supportsInterface(ERC721_INTERFACE_ID);
    
    if (supports721) {
      console.log('Detected BEP-721 standard');
      return await sendBEP721(wallet, contractAddress, toAddress, tokenId);
    }
  } catch (error) {
    // Not BEP-721, try BEP-1155
  }
  
  // Try BEP-1155
  try {
    const bep1155Contract = new ethers.Contract(contractAddress, BEP1155_ABI, wallet);
    const supports1155 = await bep1155Contract.supportsInterface(ERC1155_INTERFACE_ID);
    
    if (supports1155) {
      console.log('Detected BEP-1155 standard');
      return await sendBEP1155(wallet, contractAddress, toAddress, tokenId, amount);
    }
  } catch (error) {
    throw new Error('Contract does not support BEP-721 or BEP-1155 standards');
  }
  
  throw new Error('Could not detect NFT standard');
}

/**
 * Send NFT on BSC
 * @param {string} rpcUrl - RPC URL for BSC
 * @param {string} privateKey - Private key of the sender
 * @param {string} contractAddress - NFT contract address
 * @param {string} toAddress - Recipient address
 * @param {string} tokenId - Token ID to transfer
 * @param {number} amount - Amount (for BEP-1155, default 1)
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction receipt
 */
export async function sendBSCNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId, amount = 1) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Sending NFT from: ${wallet.address}`);
  console.log(`To: ${toAddress}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Token ID: ${tokenId}\n`);
  
  return await detectAndSend(wallet, contractAddress, toAddress, tokenId, amount);
}

/**
 * Main function to run the script
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Default BSC RPC URL
  const defaultBSCRPC = 'https://bsc-dataseed1.binance.org';
  
  const rpcUrl = args[0] || defaultBSCRPC;
  const privateKey = args[1] || '';
  const contractAddress = args[2] || '';
  const toAddress = args[3] || '';
  const tokenId = args[4] || '';
  const amount = args[5] ? parseInt(args[5]) : 1;
  
  if (!privateKey || !contractAddress || !toAddress || !tokenId) {
    console.log('Usage: node sendBSCNFTs.js <rpcUrl> <privateKey> <contractAddress> <toAddress> <tokenId> [amount]');
    console.log('\nExample:');
    console.log('  node sendBSCNFTs.js https://bsc-dataseed1.binance.org 0xPrivateKey 0xContract 0xRecipient 123');
    console.log('\nFor BEP-1155 (with amount):');
    console.log('  node sendBSCNFTs.js https://bsc-dataseed1.binance.org 0xPrivateKey 0xContract 0xRecipient 123 1');
    console.log('\nSupported standards: BEP-721, BEP-1155');
    console.log('\n⚠️  WARNING: Never share your private key!');
    return;
  }
  
  try {
    const receipt = await sendBSCNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId, amount);
    console.log('\n✅ NFT sent successfully!');
    console.log(`Transaction hash: ${receipt.hash}`);
  } catch (error) {
    console.error('\n❌ Error sending NFT:', error.message);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('sendBSCNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}

