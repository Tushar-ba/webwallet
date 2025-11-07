# NFT Collectibles Fetcher

Scripts to fetch NFTs owned by an address across different blockchain networks.

## Supported Standards

- **EVM Chains**: ERC-721, ERC-1155
- **BSC**: BEP-721, BEP-1155
- **Solana**: SPL, Metaplex

## Supported Networks

### EVM Chains
- Ethereum (ETH)
- Polygon (POL)
- Arbitrum (ARB)
- BASE
- Avalanche (AVAX)

### BSC
- Binance Smart Chain (BSC)

### Solana
- Mainnet
- Devnet (default)
- Testnet

## Installation

```bash
npm install
```

## Usage

### Fetch EVM NFTs

```bash
node fetchEVMNFTs.js <rpcUrl> <ownerAddress> [contractAddress1] [contractAddress2] ...
```

**Example:**
```bash
# Ethereum
node fetchEVMNFTs.js https://eth.llamarpc.com 0x1234...5678 0xContract1 0xContract2

# Polygon
node fetchEVMNFTs.js https://polygon-rpc.com 0x1234...5678 0xContract1

# Arbitrum
node fetchEVMNFTs.js https://arb1.arbitrum.io/rpc 0x1234...5678 0xContract1
```

**Default RPC URLs:**
- Ethereum: `https://eth.llamarpc.com`
- Polygon: `https://polygon-rpc.com`
- Arbitrum: `https://arb1.arbitrum.io/rpc`
- BASE: `https://mainnet.base.org`
- Avalanche: `https://api.avax.network/ext/bc/C/rpc`

### Fetch BSC NFTs

```bash
node fetchBSCNFTs.js <rpcUrl> <ownerAddress> [contractAddress1] [contractAddress2] ...
```

**Example:**
```bash
node fetchBSCNFTs.js https://bsc-dataseed1.binance.org 0x1234...5678 0xContract1 0xContract2
```

**Default RPC URL:**
- BSC: `https://bsc-dataseed1.binance.org`

### Fetch Solana NFTs

```bash
node fetchSolanaNFTs.js <rpcUrl> <ownerAddress>
```

**Example:**
```bash
# Devnet (default)
node fetchSolanaNFTs.js https://api.devnet.solana.com 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# Mainnet
node fetchSolanaNFTs.js https://api.mainnet-beta.solana.com 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

**Default RPC URLs:**
- Devnet: `https://api.devnet.solana.com` (default)
- Mainnet: `https://api.mainnet-beta.solana.com`
- Testnet: `https://api.testnet.solana.com`

## Using NPM Scripts

### Fetch NFTs
```bash
# Fetch EVM NFTs
npm run fetch-evm

# Fetch BSC NFTs
npm run fetch-bsc

# Fetch Solana NFTs
npm run fetch-solana
```

### Send NFTs
```bash
# Send EVM NFTs
npm run send-evm

# Send BSC NFTs
npm run send-bsc

# Send Solana NFTs
npm run send-solana
```

## Send NFTs

### Send EVM NFTs

```bash
node sendEVMNFTs.js <rpcUrl> <privateKey> <contractAddress> <toAddress> <tokenId> [amount]
```

**Example:**
```bash
# ERC-721
node sendEVMNFTs.js https://eth.llamarpc.com 0xPrivateKey 0xContract 0xRecipient 123

# ERC-1155 (with amount)
node sendEVMNFTs.js https://eth.llamarpc.com 0xPrivateKey 0xContract 0xRecipient 123 1
```

**Parameters:**
- `rpcUrl` - RPC URL for the chain
- `privateKey` - Sender's private key (keep secure!)
- `contractAddress` - NFT contract address
- `toAddress` - Recipient address
- `tokenId` - Token ID to transfer
- `amount` - (Optional) Amount for ERC-1155, default is 1

### Send BSC NFTs

```bash
node sendBSCNFTs.js <rpcUrl> <privateKey> <contractAddress> <toAddress> <tokenId> [amount]
```

**Example:**
```bash
# BEP-721
node sendBSCNFTs.js https://bsc-dataseed1.binance.org 0xPrivateKey 0xContract 0xRecipient 123

# BEP-1155 (with amount)
node sendBSCNFTs.js https://bsc-dataseed1.binance.org 0xPrivateKey 0xContract 0xRecipient 123 1
```

### Send Solana NFTs

```bash
node sendSolanaNFTs.js <rpcUrl> <privateKey> <mintAddress> <toAddress> [standard]
```

**Example:**
```bash
# Auto-detect standard
node sendSolanaNFTs.js https://api.devnet.solana.com <privateKey> <mintAddress> <toAddress>

# Force Metaplex
node sendSolanaNFTs.js https://api.devnet.solana.com <privateKey> <mintAddress> <toAddress> Metaplex

# Force SPL
node sendSolanaNFTs.js https://api.devnet.solana.com <privateKey> <mintAddress> <toAddress> SPL
```

**Parameters:**
- `rpcUrl` - RPC URL for Solana
- `privateKey` - Sender's private key (base58 or JSON array) (⚠️ keep secure!)
- `mintAddress` - NFT mint address
- `toAddress` - Recipient public key
- `standard` - (Optional) 'SPL' or 'Metaplex' to force standard, otherwise auto-detects

## Notes

### EVM & BSC
- Contract addresses must be provided to check for NFTs
- For automatic discovery, consider using:
  - Subgraph services
  - Indexer APIs (Alchemy, Moralis, etc.)
  - Blockchain explorers (Etherscan, BSCScan)
- Sending NFTs requires:
  - Private key of the sender
  - Contract address
  - Token ID
  - Recipient address
- Scripts automatically handle approvals when needed

### Solana
- Automatically fetches both SPL tokens and Metaplex NFTs
- No contract addresses needed
- SPL tokens are identified by decimals = 0 and amount = 1
- Sending NFTs requires:
  - Private key (base58 encoded or JSON array)
  - Mint address
  - Recipient public key
- Scripts auto-detect standard (SPL or Metaplex) or you can specify

## Output Format

### EVM/BSC NFTs
```json
{
  "tokenId": "123",
  "tokenURI": "https://...",
  "standard": "ERC-721",
  "contractAddress": "0x..."
}
```

### Solana NFTs
```json
{
  "splTokens": [
    {
      "mint": "...",
      "tokenAccount": "...",
      "amount": "1",
      "standard": "SPL"
    }
  ],
  "metaplexNFTs": [
    {
      "mint": "...",
      "name": "NFT Name",
      "symbol": "SYMBOL",
      "uri": "https://...",
      "standard": "Metaplex"
    }
  ]
}
```

## Security Warning

**NEVER share your private keys!** Always keep them secure and never commit them to version control.

## Dependencies

- `ethers` - For EVM and BSC chains
- `@solana/web3.js` - For Solana blockchain
- `@metaplex-foundation/js` - For Metaplex NFT support
- `@solana/spl-token` - For SPL token transfers
- `bs58` - For base58 encoding/decoding

## License

ISC

