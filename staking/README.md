# Staking Pool Smart Contract

A production-ready, upgradeable staking smart contract built with Solidity and OpenZeppelin's upgradeable proxy pattern (UUPS).

## Features

- **Multiple Staking Pools**: Create and manage multiple staking pools with different configurations
- **Flexible Pool Configuration**: Each pool can have:
  - Custom APY (Annual Percentage Yield)
  - Configurable lock periods
  - Minimum and maximum stake amounts
  - Separate staking and reward tokens
- **User Staking**: Users can stake tokens by selecting a pool and amount
- **Reward Calculation**: Automatic reward calculation based on APY and staking duration
- **Reward Claiming**: Users can claim rewards at any time during the staking period
- **Automatic Unstaking**: Users can unstake after the lock period ends
- **Upgradeable**: Uses UUPS (Universal Upgradeable Proxy Standard) for contract upgrades
- **Security**: Includes reentrancy guards, access controls, and comprehensive error handling

## Contract Architecture

### Main Contract: `StakingPool.sol`

The main staking contract that implements:
- Pool creation and management
- User staking and unstaking
- Reward calculation and distribution
- Upgradeable proxy pattern (UUPS)

### Interface: `IStakingPool.sol`

Standard interface for interacting with the staking pool contract.

## Installation

```bash
npm install
```

## Compilation

```bash
npx hardhat compile
```

## Deployment

### Deploy New Contract

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

### Upgrade Existing Contract

```bash
PROXY_ADDRESS=<proxy-address> npx hardhat run scripts/upgrade.js --network <network-name>
```

## Usage

### 1. Initialize the Contract

The contract is initialized with the owner address:

```javascript
await stakingPool.initialize(ownerAddress);
```

### 2. Create a Staking Pool

Only the owner can create pools:

```javascript
await stakingPool.createPool(
  tokenAddress,        // Address of the token to stake
  rewardTokenAddress,  // Address of the reward token
  apy,                 // APY in basis points (e.g., 1000 = 10%)
  lockPeriod,          // Lock period in seconds
  minStakeAmount,       // Minimum stake amount
  maxStakeAmount        // Maximum stake amount per user
);
```

### 3. Stake Tokens

Users can stake tokens into a pool:

```javascript
await stakingPool.stake(poolId, amount);
```

**Requirements:**
- Pool must be active
- Amount must be between min and max stake amounts
- User must have approved the contract to spend tokens
- User's total staked in the pool must not exceed max stake amount

### 4. Claim Rewards

Users can claim rewards at any time:

```javascript
await stakingPool.claimRewards(stakeId);
```

Rewards are calculated based on:
- Staked amount
- APY of the pool
- Time staked (in seconds)

Formula: `(amount * APY * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR)`

### 5. Unstake Tokens

Users can unstake after the lock period ends:

```javascript
await stakingPool.unstake(stakeId);
```

**Note:** Any pending rewards are automatically claimed when unstaking.

### 6. Deposit Rewards

Pool administrators can deposit reward tokens:

```javascript
await stakingPool.depositRewards(poolId, amount);
```

## View Functions

### Get Pool Information

```javascript
const poolInfo = await stakingPool.getPoolInfo(poolId);
// Returns: tokenAddress, rewardTokenAddress, apy, lockPeriod, 
//          minStakeAmount, maxStakeAmount, totalStaked, isActive
```

### Get Stake Information

```javascript
const stakeInfo = await stakingPool.getStakeInfo(stakeId);
// Returns: user, poolId, amount, stakedAt, unlockTime, 
//          claimedRewards, pendingRewards
```

### Get User's Stakes

```javascript
const stakeIds = await stakingPool.getUserStakes(userAddress);
// Returns: Array of stake IDs for the user
```

## Events

- `PoolCreated`: Emitted when a new pool is created
- `PoolUpdated`: Emitted when pool parameters are updated
- `Staked`: Emitted when a user stakes tokens
- `Unstaked`: Emitted when a user unstakes tokens
- `RewardsClaimed`: Emitted when rewards are claimed
- `RewardsDeposited`: Emitted when rewards are deposited into a pool
- `EmergencyWithdraw`: Emitted during emergency withdrawals

## Security Features

1. **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
2. **Access Control**: Only owner can create/update pools and perform emergency operations
3. **Input Validation**: Comprehensive checks for all parameters
4. **Safe Token Transfers**: Uses OpenZeppelin's SafeERC20 for secure token transfers
5. **Upgradeable**: Uses UUPS proxy pattern with owner-controlled upgrades

## Error Handling

The contract uses custom errors for gas efficiency:
- `PoolNotFound`: Pool ID doesn't exist
- `PoolInactive`: Pool is not active
- `InvalidAmount`: Amount is zero or invalid
- `AmountBelowMinimum`: Amount is below minimum requirement
- `AmountExceedsMaximum`: Amount exceeds maximum limit
- `StakeNotFound`: Stake ID doesn't exist
- `StakeNotUnlocked`: Lock period hasn't ended
- `StakeAlreadyUnstaked`: Stake has already been unstaked
- `InsufficientRewards`: Not enough reward tokens available
- `NotStakeOwner`: Caller is not the stake owner

## Testing

```bash
npx hardhat test
```

## Gas Optimization

- Uses custom errors instead of require strings
- Efficient storage layout
- Minimal external calls
- Optimized reward calculations

## Upgradeability

The contract uses UUPS (Universal Upgradeable Proxy Standard) pattern:
- Only the owner can authorize upgrades
- Implementation can be upgraded without changing the proxy address
- Storage layout must be preserved across upgrades

## License

MIT

## Support

For issues or questions, please refer to the contract code and comments.
