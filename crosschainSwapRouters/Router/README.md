# Cross-Chain Swap Router

Cross-chain swap router leveraging LayerZero v2 OApp framework for ERC20 token swaps across multiple EVM chains.

## Supported Chains

- Sepolia
- Polygon Amoy
- BSC Testnet
- Arbitrum Sepolia
- Base Sepolia
- Avalanche Fuji
- Cronos Testnet
- Celo Alfajores

## Commands

### Compile Contracts
```shell
npx hardhat compile
```

### Test
```shell
npx hardhat test
```

### Configure Cross-Chain Routing

Wire LayerZero OApp routing between all configured chains:

```shell
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

**Note:** Make sure to update contract addresses in `layerzero.config.ts` after deploying to each network.
