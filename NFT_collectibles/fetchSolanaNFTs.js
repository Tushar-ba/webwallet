import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

/**
 * Fetch SPL tokens (including NFTs) owned by an address
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} ownerAddress - Public key of the owner
 * @returns {Promise<Array>} Array of token accounts
 */
async function fetchSPLTokens(connection, ownerAddress) {
  const tokens = [];
  
  try {
    // Get all token accounts owned by the address
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerAddress, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program
    });
    
    for (const accountInfo of tokenAccounts.value) {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const tokenAmount = parsedInfo.tokenAmount;
      
      // Check if it's an NFT (decimals = 0 and supply = 1)
      if (tokenAmount.decimals === 0 && tokenAmount.uiAmount === 1) {
        tokens.push({
          mint: parsedInfo.mint,
          tokenAccount: accountInfo.pubkey.toString(),
          amount: tokenAmount.uiAmountString,
          standard: 'SPL',
          decimals: tokenAmount.decimals
        });
      }
    }
  } catch (error) {
    console.error('Error fetching SPL tokens:', error.message);
  }
  
  return tokens;
}

/**
 * Fetch Metaplex NFTs owned by an address
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} ownerAddress - Public key of the owner
 * @returns {Promise<Array>} Array of NFT objects
 */
async function fetchMetaplexNFTs(connection, ownerAddress) {
  const nfts = [];
  
  try {
    // Initialize Metaplex
    const metaplex = Metaplex.make(connection);
    
    // Fetch all NFTs owned by the address
    const assets = await metaplex.nfts().findAllByOwner({ owner: ownerAddress });
    
    for (const asset of assets) {
      try {
        // Fetch full NFT metadata
        const nft = await metaplex.nfts().load({ metadata: asset });
        
        nfts.push({
          mint: nft.address.toString(),
          name: nft.name,
          symbol: nft.symbol,
          uri: nft.uri,
          standard: 'Metaplex',
          collection: nft.collection ? nft.collection.address.toString() : null,
          creators: nft.creators.map(c => ({
            address: c.address.toString(),
            verified: c.verified,
            share: c.share
          }))
        });
      } catch (error) {
        console.error(`Error loading NFT ${asset.address.toString()}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error fetching Metaplex NFTs:', error.message);
  }
  
  return nfts;
}

/**
 * Fetch all NFTs owned by an address on Solana
 * @param {string} rpcUrl - RPC URL for Solana
 * @param {string} ownerAddress - Solana address (public key) to check
 * @returns {Promise<Object>} Object containing SPL tokens and Metaplex NFTs
 */
export async function fetchSolanaNFTs(rpcUrl, ownerAddress) {
  const connection = new Connection(rpcUrl, 'confirmed');
  let ownerPublicKey;
  
  try {
    ownerPublicKey = new PublicKey(ownerAddress);
  } catch (error) {
    throw new Error(`Invalid Solana address: ${ownerAddress}`);
  }
  
  const results = {
    splTokens: [],
    metaplexNFTs: []
  };
  
  console.log('Fetching SPL tokens...');
  results.splTokens = await fetchSPLTokens(connection, ownerPublicKey);
  
  console.log('Fetching Metaplex NFTs...');
  results.metaplexNFTs = await fetchMetaplexNFTs(connection, ownerPublicKey);
  
  return results;
}

/**
 * Main function to run the script
 */
async function main() {
  // Get parameters from command line or use defaults
  const args = process.argv.slice(2);
  
  // Default Solana RPC URLs
  const defaultRPCs = {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com'
  };
  
  // Example usage
  const rpcUrl = args[0] || defaultRPCs.devnet;
  const ownerAddress = args[1] || '';
  
  if (!ownerAddress) {
    console.log('Usage: node fetchSolanaNFTs.js <rpcUrl> <ownerAddress>');
    console.log('\nExample:');
    console.log('  node fetchSolanaNFTs.js https://api.devnet.solana.com 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    console.log('\nDefault RPC (if not provided):');
    console.log('  Devnet: https://api.devnet.solana.com');
    console.log('  Mainnet: https://api.mainnet-beta.solana.com');
    console.log('  Testnet: https://api.testnet.solana.com');
    console.log('\nSupported standards: SPL, Metaplex');
    return;
  }
  
  console.log(`Fetching NFTs for address: ${ownerAddress}`);
  console.log(`Using RPC: ${rpcUrl}\n`);
  
  try {
    const results = await fetchSolanaNFTs(rpcUrl, ownerAddress);
    
    console.log(`\nFound ${results.splTokens.length} SPL token(s):\n`);
    results.splTokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.standard} - Mint: ${token.mint}`);
      console.log(`   Token Account: ${token.tokenAccount}`);
      console.log(`   Amount: ${token.amount}\n`);
    });
    
    console.log(`\nFound ${results.metaplexNFTs.length} Metaplex NFT(s):\n`);
    results.metaplexNFTs.forEach((nft, index) => {
      console.log(`${index + 1}. ${nft.standard} - ${nft.name || 'Unnamed'}`);
      console.log(`   Mint: ${nft.mint}`);
      console.log(`   Symbol: ${nft.symbol || 'N/A'}`);
      console.log(`   URI: ${nft.uri}`);
      if (nft.collection) {
        console.log(`   Collection: ${nft.collection}`);
      }
      console.log('');
    });
    
    return results;
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly (check if this file is the main module)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('fetchSolanaNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}

