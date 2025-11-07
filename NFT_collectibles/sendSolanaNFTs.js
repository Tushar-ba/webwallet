import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token';

/**
 * Send SPL Token (NFT)
 * @param {Connection} connection - Solana connection
 * @param {Keypair} fromKeypair - Sender's keypair
 * @param {PublicKey} mintAddress - Token mint address
 * @param {PublicKey} toAddress - Recipient address
 * @returns {Promise<string>} Transaction signature
 */
async function sendSPLToken(connection, fromKeypair, mintAddress, toAddress) {
  const fromAddress = fromKeypair.publicKey;
  
  // Get associated token addresses
  const fromTokenAccount = getAssociatedTokenAddressSync(
    mintAddress,
    fromAddress
  );
  
  const toTokenAccount = getAssociatedTokenAddressSync(
    mintAddress,
    toAddress
  );
  
  // Check if sender has the token account
  try {
    const accountInfo = await getAccount(connection, fromTokenAccount);
    if (Number(accountInfo.amount) < 1) {
      throw new Error('Insufficient balance');
    }
  } catch (error) {
    throw new Error('Sender does not own this NFT');
  }
  
  // Check if recipient token account exists, create if not
  const transaction = new Transaction();
  
  try {
    await getAccount(connection, toTokenAccount);
  } catch (error) {
    // Create associated token account for recipient
    console.log('Creating recipient token account...');
    const createATAInstruction = createAssociatedTokenAccountInstruction(
      fromAddress, // Payer
      toTokenAccount, // ATA address
      toAddress, // Owner
      mintAddress // Mint
    );
    transaction.add(createATAInstruction);
  }
  
  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromAddress,
    1n, // Amount (1 for NFT, using BigInt)
    [] // Signers (empty for standard transfer)
  );
  
  transaction.add(transferInstruction);
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromAddress;
  
  // Sign transaction
  transaction.sign(fromKeypair);
  
  // Send transaction
  console.log('Sending transaction...');
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3
  });
  
  console.log(`Transaction signature: ${signature}`);
  console.log('Waiting for confirmation...');
  
  // Confirm transaction
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, 'confirmed');
  console.log('Transaction confirmed!');
  
  return signature;
}

/**
 * Send Metaplex NFT
 * @param {Connection} connection - Solana connection
 * @param {Keypair} fromKeypair - Sender's keypair
 * @param {PublicKey} mintAddress - NFT mint address
 * @param {PublicKey} toAddress - Recipient address
 * @returns {Promise<string>} Transaction signature
 */
async function sendMetaplexNFT(connection, fromKeypair, mintAddress, toAddress) {
  // Initialize Metaplex
  const metaplex = Metaplex.make(connection).use(keypairIdentity(fromKeypair));
  
  // Load the NFT
  const nft = await metaplex.nfts().findByMint({ mintAddress });
  
  if (!nft) {
    throw new Error('NFT not found');
  }
  
  // Verify ownership
  const currentOwner = nft.owner;
  if (!currentOwner.equals(fromKeypair.publicKey)) {
    throw new Error('You do not own this NFT');
  }
  
  console.log(`Transferring NFT: ${nft.name || 'Unnamed'}`);
  console.log(`From: ${fromKeypair.publicKey.toString()}`);
  console.log(`To: ${toAddress.toString()}`);
  
  // Transfer the NFT
  const { response } = await metaplex.nfts().transfer({
    nftOrSft: nft,
    toOwner: toAddress
  });
  
  console.log(`Transaction signature: ${response.signature}`);
  console.log('Transaction confirmed!');
  
  return response.signature;
}

/**
 * Send NFT on Solana (auto-detects SPL or Metaplex)
 * @param {string} rpcUrl - RPC URL for Solana
 * @param {string} privateKey - Private key of the sender (base58 or array)
 * @param {string} mintAddress - NFT mint address
 * @param {string} toAddress - Recipient address (public key)
 * @param {string} standard - Optional: 'SPL' or 'Metaplex' to force standard
 * @returns {Promise<string>} Transaction signature
 */
export async function sendSolanaNFT(rpcUrl, privateKey, mintAddress, toAddress, standard = null) {
  const connection = new Connection(rpcUrl, 'confirmed');
  
  // Parse private key
  let keypair;
  try {
    // Try as base58 string first
    if (typeof privateKey === 'string') {
      keypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(privateKey))
      );
    } else {
      keypair = Keypair.fromSecretKey(new Uint8Array(privateKey));
    }
  } catch (error) {
    // Try as base58
    try {
      const { decode } = await import('bs58');
      keypair = Keypair.fromSecretKey(decode(privateKey));
    } catch (e) {
      throw new Error('Invalid private key format. Use base58 string or Uint8Array.');
    }
  }
  
  const mintPublicKey = new PublicKey(mintAddress);
  const toPublicKey = new PublicKey(toAddress);
  
  console.log(`Sending NFT from: ${keypair.publicKey.toString()}`);
  console.log(`To: ${toAddress}`);
  console.log(`Mint: ${mintAddress}\n`);
  
  // Try Metaplex first (more common for NFTs)
  if (!standard || standard === 'Metaplex') {
    try {
      console.log('Attempting Metaplex transfer...');
      return await sendMetaplexNFT(connection, keypair, mintPublicKey, toPublicKey);
    } catch (error) {
      if (standard === 'Metaplex') {
        throw error;
      }
      console.log('Metaplex transfer failed, trying SPL...');
    }
  }
  
  // Try SPL token
  if (!standard || standard === 'SPL') {
    try {
      console.log('Attempting SPL token transfer...');
      return await sendSPLToken(connection, keypair, mintPublicKey, toPublicKey);
    } catch (error) {
      if (standard === 'SPL') {
        throw error;
      }
      throw new Error(`Failed to transfer NFT. Metaplex error: ${error.message}`);
    }
  }
  
  throw new Error('Invalid standard specified. Use "SPL" or "Metaplex"');
}

/**
 * Main function to run the script
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Default Solana RPC URLs
  const defaultRPCs = {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com'
  };
  
  const rpcUrl = args[0] || defaultRPCs.devnet;
  const privateKey = args[1] || '';
  const mintAddress = args[2] || '';
  const toAddress = args[3] || '';
  const standard = args[4] || null; // Optional: 'SPL' or 'Metaplex'
  
  if (!privateKey || !mintAddress || !toAddress) {
    console.log('Usage: node sendSolanaNFTs.js <rpcUrl> <privateKey> <mintAddress> <toAddress> [standard]');
    console.log('\nExample:');
    console.log('  node sendSolanaNFTs.js https://api.devnet.solana.com <privateKey> <mintAddress> <toAddress>');
    console.log('\nWith standard specified:');
    console.log('  node sendSolanaNFTs.js https://api.devnet.solana.com <privateKey> <mintAddress> <toAddress> Metaplex');
    console.log('\nDefault RPC (if not provided):');
    console.log('  Devnet: https://api.devnet.solana.com');
    console.log('  Mainnet: https://api.mainnet-beta.solana.com');
    console.log('\nSupported standards: SPL, Metaplex');
    console.log('\n⚠️  WARNING: Never share your private key!');
    console.log('\nNote: Private key should be base58 encoded string or JSON array');
    return;
  }
  
  try {
    const signature = await sendSolanaNFT(rpcUrl, privateKey, mintAddress, toAddress, standard);
    console.log('\n✅ NFT sent successfully!');
    console.log(`Transaction signature: ${signature}`);
  } catch (error) {
    console.error('\n❌ Error sending NFT:', error.message);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('sendSolanaNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}

