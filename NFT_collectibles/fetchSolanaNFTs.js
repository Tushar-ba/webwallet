import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

async function fetchSPLTokens(connection, ownerAddress) {
  const tokens = [];
  
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerAddress, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    for (const accountInfo of tokenAccounts.value) {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const tokenAmount = parsedInfo.tokenAmount;
      
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
    // Return empty array on error
  }
  
  return tokens;
}

async function fetchMetaplexNFTs(connection, ownerAddress) {
  const nfts = [];
  
  try {
    const metaplex = Metaplex.make(connection);
    const assets = await metaplex.nfts().findAllByOwner({ owner: ownerAddress });
    
    for (const asset of assets) {
      try {
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
        // Skip invalid NFTs
      }
    }
  } catch (error) {
    // Return empty array on error
  }
  
  return nfts;
}

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
  
  results.splTokens = await fetchSPLTokens(connection, ownerPublicKey);
  results.metaplexNFTs = await fetchMetaplexNFTs(connection, ownerPublicKey);
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  
  const defaultRPCs = {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com'
  };
  
  const rpcUrl = args[0] || defaultRPCs.devnet;
  const ownerAddress = args[1] || '';
  
  if (!ownerAddress) {
    console.log('Usage: node fetchSolanaNFTs.js <rpcUrl> <ownerAddress>');
    console.log('Example: node fetchSolanaNFTs.js https://api.devnet.solana.com 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    return;
  }
  
  try {
    const results = await fetchSolanaNFTs(rpcUrl, ownerAddress);
    
    console.log(`Found ${results.splTokens.length} SPL token(s)`);
    results.splTokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.standard} - Mint: ${token.mint}`);
      console.log(`   Token Account: ${token.tokenAccount}`);
      console.log(`   Amount: ${token.amount}`);
    });
    
    console.log(`\nFound ${results.metaplexNFTs.length} Metaplex NFT(s)`);
    results.metaplexNFTs.forEach((nft, index) => {
      console.log(`${index + 1}. ${nft.standard} - ${nft.name || 'Unnamed'}`);
      console.log(`   Mint: ${nft.mint}`);
      console.log(`   Symbol: ${nft.symbol || 'N/A'}`);
      console.log(`   URI: ${nft.uri}`);
      if (nft.collection) {
        console.log(`   Collection: ${nft.collection}`);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('fetchSolanaNFTs.js');
if (isMainModule) {
  main().catch(console.error);
}
