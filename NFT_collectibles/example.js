import { fetchEVMNFTs } from './fetchEVMNFTs.js';
import { fetchBSCNFTs } from './fetchBSCNFTs.js';
import { fetchSolanaNFTs } from './fetchSolanaNFTs.js';
import { sendEVMNFT } from './sendEVMNFTs.js';
import { sendBSCNFT } from './sendBSCNFTs.js';
import { sendSolanaNFT } from './sendSolanaNFTs.js';

async function exampleEVM() {
  const rpcUrl = 'https://eth.llamarpc.com';
  const ownerAddress = '0x1234567890123456789012345678901234567890';
  const contractAddresses = ['0xContract1', '0xContract2'];
  const nfts = await fetchEVMNFTs(rpcUrl, ownerAddress, contractAddresses);
  console.log('EVM NFTs:', nfts);
}

async function exampleBSC() {
  const rpcUrl = 'https://bsc-dataseed1.binance.org';
  const ownerAddress = '0x1234567890123456789012345678901234567890';
  const contractAddresses = ['0xContract1', '0xContract2'];
  const nfts = await fetchBSCNFTs(rpcUrl, ownerAddress, contractAddresses);
  console.log('BSC NFTs:', nfts);
}

async function exampleSolana() {
  const rpcUrl = 'https://api.devnet.solana.com';
  const ownerAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const results = await fetchSolanaNFTs(rpcUrl, ownerAddress);
  console.log('Solana NFTs:', results);
}

async function exampleSendEVM() {
  const rpcUrl = 'https://eth.llamarpc.com';
  const privateKey = '0xYourPrivateKey';
  const contractAddress = '0xContractAddress';
  const toAddress = '0xRecipientAddress';
  const tokenId = '123';
  const receipt = await sendEVMNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId);
  console.log('EVM NFT sent:', receipt.hash);
}

async function exampleSendBSC() {
  const rpcUrl = 'https://bsc-dataseed1.binance.org';
  const privateKey = '0xYourPrivateKey';
  const contractAddress = '0xContractAddress';
  const toAddress = '0xRecipientAddress';
  const tokenId = '123';
  const receipt = await sendBSCNFT(rpcUrl, privateKey, contractAddress, toAddress, tokenId);
  console.log('BSC NFT sent:', receipt.hash);
}

async function exampleSendSolana() {
  const rpcUrl = 'https://api.devnet.solana.com';
  const privateKey = 'YourBase58PrivateKey';
  const mintAddress = 'MintAddress';
  const toAddress = 'RecipientPublicKey';
  const signature = await sendSolanaNFT(rpcUrl, privateKey, mintAddress, toAddress);
  console.log('Solana NFT sent:', signature);
}

// exampleEVM().catch(console.error);
// exampleBSC().catch(console.error);
// exampleSolana().catch(console.error);
// exampleSendEVM().catch(console.error);
// exampleSendBSC().catch(console.error);
// exampleSendSolana().catch(console.error);

