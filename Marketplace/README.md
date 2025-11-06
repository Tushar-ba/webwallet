# Marketplace Contracts

A comprehensive NFT marketplace system built on Solidity, featuring ERC1155 token support, royalty management, and advanced trading features.

## Overview

This contracts directory contains the core smart contracts for an NFT marketplace platform:

- **Token.sol** - ERC1155 token contract with royalty management
- **Marketplace.sol** - Full-featured NFT marketplace with trading, exchanges, and airdrops
- **Interface/** - Contract interfaces for integration

## Contracts

### Token.sol

An upgradeable ERC1155 token contract implementing custom royalty management and marketplace integration.

#### Key Features

- **ERC1155 Multi-Token Standard** - Supports multiple token types with different quantities
- **Royalty Management** - Configurable royalty recipients and percentages per token
- **Royalty Manager Transfer** - Transfer royalty management rights between addresses
- **Marketplace Integration** - Seamless integration with marketplace contract
- **UUPS Upgradeable** - Upgradeable proxy pattern for future improvements
- **URI Storage** - Per-token metadata URI support

#### Main Functions

- `initialize()` - Initialize the contract with owner and base URI
- `mintAndList()` - Mint tokens and automatically list them on marketplace
- `updateRoyaltyRecipients()` - Update royalty recipients and percentages
- `transferRoyaltyManagement()` - Transfer royalty management to another address
- `setMarketplaceContractAddress()` - Link marketplace contract address

### Marketplace.sol

A comprehensive NFT marketplace supporting multiple trading mechanisms and fee structures.

#### Key Features

- **Standard Listings** - List NFTs for sale with fixed prices
- **Special Listings** - Direct purchase listings with royalty manager transfer
- **NFT Exchange** - Peer-to-peer NFT swapping functionality
- **Airdrop System** - Register and claim token airdrops
- **Royalty Distribution** - Automatic royalty distribution on sales
- **Fee Management** - Different fee structures for first-time sales vs resales
- **Reentrancy Protection** - Secure against reentrancy attacks
- **UUPS Upgradeable** - Upgradeable proxy pattern

#### Main Functions

**Listing & Trading:**
- `listNFT()` - List NFTs for sale
- `updateListedNFT()` - Update listing price and amount
- `purchaseNFT()` - Purchase listed NFTs
- `cancelListing()` - Cancel active listings
- `listSpecialNFT()` - Create special direct purchase listings
- `specialBuy()` - Purchase from special listings

**Exchange:**
- `registerNftExchange()` - Register NFTs for peer-to-peer exchange
- `approveNftForExchange()` - Approve an exchange proposal
- `cancelNftExchange()` - Cancel exchange registration

**Airdrops:**
- `registerAirdrop()` - Register tokens for airdrop distribution
- `claimAirdrops()` - Claim available airdrops

**Administration:**
- `updateFirstTimeSaleFee()` - Configure first-time sale fee structure
- `updateResellFee()` - Configure resale fee structure
- `updatePlatformFeeReceiver()` - Update platform fee recipient address
- `updateMaxNFTCap()` - Set maximum NFT cap per exchange
- `withdrawUndistributedFunds()` - Withdraw undistributed funds

## Fee Structure

### First-Time Sale
- Platform Fee: 10% (configurable)
- Splits: 90% (royalties)
- Seller Share: 0%

### Resale
- Platform Fee: 5% (configurable)
- Splits: 5% (royalties)
- Seller Share: 90%

## Security Features

- **ReentrancyGuard** - Protection against reentrancy attacks
- **Ownable** - Access control for administrative functions
- **UUPS Upgradeable** - Secure upgrade mechanism
- **Input Validation** - Comprehensive parameter validation
- **Error Handling** - Custom error types for gas efficiency

## Interfaces

### IMarketplace.sol
Interface defining marketplace contract methods:
- `listNFT()` - List NFT function signature
- `registerAirdrop()` - Airdrop registration signature

### IToken.sol
Interface defining token contract methods:
- `balanceOf()` - Check token balance
- `isApprovedForAll()` - Check operator approval
- `tokenRoyaltyManager()` - Get royalty manager
- `getRoyaltyInfo()` - Get royalty recipients and percentages
- `transferRoyaltyManagement()` - Transfer royalty management
- `updateRoyaltyRecipients()` - Update royalty recipients

## Usage

### Deployment

Both contracts use UUPS upgradeable pattern and must be deployed via proxy:

1. Deploy implementation contracts
2. Deploy proxy contracts pointing to implementations
3. Initialize contracts through proxy

### Integration

```solidity
// Token contract initialization
token.initialize(owner, baseURI);

// Marketplace contract initialization
marketplace.initialize(owner, tokenAddress, platformFeeReceiver);

// Link marketplace to token
token.setMarketplaceContractAddress(marketplaceAddress);
```

## Events

Both contracts emit comprehensive events for:
- Token minting and transfers
- Listing creation and updates
- Purchase transactions
- Royalty distributions
- Exchange registrations
- Airdrop claims
- Fee configuration changes

## Requirements

- Solidity ^0.8.22
- OpenZeppelin Contracts Upgradeable ^5.0.2
- OpenZeppelin Contracts ^5.0.2

## License

MIT

