/**
 * Example usage of NFT fetching and sending functions as modules
 */

import { fetchEVMNFTs } from './fetchEVMNFTs.js';
import { fetchBSCNFTs } from './fetchBSCNFTs.js';
import { fetchSolanaNFTs } from './fetchSolanaNFTs.js';
import { sendEVMNFT } from './sendEVMNFTs.js';
import { sendBSCNFT } from './sendBSCNFTs.js';
import { sendSolanaNFT } from './sendSolanaNFTs.js';

// Example: Fetch EVM NFTs
async function exampleEVM() {
  const rpcUrl = 'https://eth.llamarpc.com';
  const ownerAddress = '0x1234567890123456789012345678901234567890';
  const contractAddresses = [
    '0xContract1',
    '0xContract2'
  ];
  
  const nfts = await fetchEVMNFTs(rpcUrl, ownerAddress, contractAddresses);
  console.log('EVM NFTs:', nfts);
}

// Example: Fetch BSC NFTs
async function exampleBSC() {
  const rpcUrl = 'https://bsc-dataseed1.binance.org';
  const ownerAddress = '0x1234567890123456789012345678901234567890';
  const contractAddresses = [
    '0xContract1',
    '0xContract2'
  ];
  
  const nfts = await fetchBSCNFTs(rpcUrl, ownerAddress, contractAddresses);
  console.log('BSC NFTs:', nfts);
}

// Example: Fetch Solana NFTs
async function exampleSolana() {
  const rpcUrl = 'https://api.devnet.solana.com';
  const ownerAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  
  const results = await fetchSolanaNFTs(rpcUrl, ownerAddress);
  console.log('Solana NFTs:', results);
}

// Example: Send EVM NFT
async function exampleSendEVM() {
  const rpcUrl = 'https://eth.llamarpc.com';
  const privateKey = '0xYourPrivateKey'; // ⚠️ Never commit real private keys!
  const contractAddress = '0xContractAddress';
  const toAddress = '0xRecipientAddress';
  const tokenId = '123';
  
  const receipt = await sendEVMNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId);
  console.log('EVM NFT sent:', receipt.hash);
}

// Example: Send BSC NFT
async function exampleSendBSC() {
  const rpcUrl = 'https://bsc-dataseed1.binance.org';
  const privateKey = '0xYourPrivateKey'; // ⚠️ Never commit real private keys!
  const contractAddress = '0xContractAddress';
  const toAddress = '0xRecipientAddress';
  const tokenId = '123';
  
  const receipt = await sendBSCNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId);
  console.log('BSC NFT sent:', receipt.hash);
}

// Example: Send Solana NFT
async function exampleSendSolana() {
  const rpcUrl = 'https://api.devnet.solana.com';
  const privateKey = 'YourBase58PrivateKey'; // ⚠️ Never commit real private keys!
  const mintAddress = 'MintAddress';
  const toAddress = 'RecipientPublicKey';
  
  const signature = await sendSolanaNFT(rpcUrl, privateKey, mintAddress, toAddress);
  console.log('Solana NFT sent:', signature);
}

// Uncomment to run examples
// exampleEVM().catch(console.error);
// exampleBSC().catch(console.error);
// exampleSolana().catch(console.error);
// exampleSendEVM().catch(console.error);
// exampleSendBSC().catch(console.error);
// exampleSendSolana().catch(console.error);

