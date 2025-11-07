import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token';

async function sendSPLToken(connection, fromKeypair, mintAddress, toAddress) {
  const fromAddress = fromKeypair.publicKey;
  
  const fromTokenAccount = getAssociatedTokenAddressSync(
    mintAddress,
    fromAddress
  );
  
  const toTokenAccount = getAssociatedTokenAddressSync(
    mintAddress,
    toAddress
  );
  
  try {
    const accountInfo = await getAccount(connection, fromTokenAccount);
    if (Number(accountInfo.amount) < 1) {
      throw new Error('Insufficient balance');
    }
  } catch (error) {
    throw new Error('Sender does not own this NFT');
  }
  
  const transaction = new Transaction();
  
  try {
    await getAccount(connection, toTokenAccount);
  } catch (error) {
    const createATAInstruction = createAssociatedTokenAccountInstruction(
      fromAddress,
      toTokenAccount,
      toAddress,
      mintAddress
    );
    transaction.add(createATAInstruction);
  }
  
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromAddress,
    1n,
    []
  );
  
  transaction.add(transferInstruction);
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromAddress;
  
  transaction.sign(fromKeypair);
  
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3
  });
  
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight
  }, 'confirmed');
  
  return signature;
}

async function sendMetaplexNFT(connection, fromKeypair, mintAddress, toAddress) {
  const metaplex = Metaplex.make(connection).use(keypairIdentity(fromKeypair));
  
  const nft = await metaplex.nfts().findByMint({ mintAddress });
  
  if (!nft) {
    throw new Error('NFT not found');
  }
  
  const currentOwner = nft.owner;
  if (!currentOwner.equals(fromKeypair.publicKey)) {
    throw new Error('You do not own this NFT');
  }
  
  const { response } = await metaplex.nfts().transfer({
    nftOrSft: nft,
    toOwner: toAddress
  });
  
  return response.signature;
}

export async function sendSolanaNFT(rpcUrl, privateKey, mintAddress, toAddress, standard = null) {
  const connection = new Connection(rpcUrl, 'confirmed');
  
  let keypair;
  try {
    if (typeof privateKey === 'string') {
      keypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(privateKey))
      );
    } else {
      keypair = Keypair.fromSecretKey(new Uint8Array(privateKey));
    }
  } catch (error) {
    try {
      const { decode } = await import('bs58');
      keypair = Keypair.fromSecretKey(decode(privateKey));
    } catch (e) {
      throw new Error('Invalid private key format. Use base58 string or Uint8Array.');
    }
  }
  
  const mintPublicKey = new PublicKey(mintAddress);
  const toPublicKey = new PublicKey(toAddress);
  
  if (!standard || standard === 'Metaplex') {
    try {
      return await sendMetaplexNFT(connection, keypair, mintPublicKey, toPublicKey);
    } catch (error) {
      if (standard === 'Metaplex') {
        throw error;
      }
    }
  }
  
  if (!standard || standard === 'SPL') {
    try {
      return await sendSPLToken(connection, keypair, mintPublicKey, toPublicKey);
    } catch (error) {
      if (standard === 'SPL') {
        throw error;
      }
      throw new Error(`Failed to transfer NFT. Error: ${error.message}`);
    }
  }
  
  throw new Error('Invalid standard specified. Use "SPL" or "Metaplex"');
}

async function main() {
  const args = process.argv.slice(2);
  
  const defaultRPCs = {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com'
  };
  
  const rpcUrl = args[0] || defaultRPCs.devnet;
  const privateKey = args[1] || '';
  const mintAddress = args[2] || '';
  const toAddress = args[3] || '';
  const standard = args[4] || null;
  
  if (!privateKey || !mintAddress || !toAddress) {
    console.log('Usage: node sendSolanaNFTs.js <rpcUrl> <privateKey> <mintAddress> <toAddress> [standard]');
    console.log('Example: node sendSolanaNFTs.js https://api.devnet.solana.com <privateKey> <mintAddress> <toAddress>');
    return;
  }
  
  try {
    const signature = await sendSolanaNFT(rpcUrl, privateKey, mintAddress, toAddress, standard);
    console.log('NFT sent successfully. Transaction signature:', signature);
  } catch (error) {
    console.error('Error sending NFT:', error.message);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('sendSolanaNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}
