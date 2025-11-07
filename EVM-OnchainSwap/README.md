# liquidityContract

This contract uses the router and factory contract of dex (rinkeby network), to help user to add liquidity to the pool,

remove liquidity from the pool , and swap tokens.

## Add Liquidity
```
function addLiquidity(address tokenA,address tokenB,uint256 amountA,uint256 amountB) external {}
```
this func adds liquidity to the pool , if the pool is not exits then it will create a new one

Note :-before calling this function user need to approve the tokens to this contract address (amountA,amountB),that user want add.

tokenA = address of first token

tokenB = address of second token

amountA = first token amount

amountB = second token amount

after executing this func user will get some Lp tokens and the pool address in the event emitted after a successful execution.

the LP token will get stored inside the contract , which user can check with by calling the 
```
liquidityOf(ownerAddress,poolAddress)
```
## Remove Liquidity
```
function removeLiquidity(address tokenA, address tokenB) external {}
```
By calling this function user can remove liquidity , that provided earlier.

tokenA = address of first token

tokenB = address of second token

Internally this function uses all the LP tokens(for a particular pool) that the user have in this contract.

After successful execution user will get back the tokens.

## Swap Tokens

```
function swapTokens(address fromToken,address toToken,uint256 tokenAmountForSwap) external {}
```
By calling this function user is able to swap tokens

fromToken = token address user want to swap

toToken = token Address user want to get after swap

tokenAmountForSwap = token amount user want to swap

Note :- User need to approve the tokenAmountForSwap from fromToken to this contract address .

after successful execution of this function user will get the desired tokens. 

# Contract Addresses
All the contract is deployed at Rinkeby network

tokenA is deployed at (0x1E97446647d94d36e987e5b353Ec66Dd53B476aB)

tokenB is deployed at (0xC52329f1e51E09D9a2B5da6426D9f946D6b16079)

ERC 20 token contract is verified. [etherscan link](https://rinkeby.etherscan.io/address/0x1E97446647d94d36e987e5b353Ec66Dd53B476aB#code)

MyLiquidity contract is deployed at [0x505B5ec5E027ceFbE7C32d1556dfCc23a7bE32cd](https://rinkeby.etherscan.io/address/0x505B5ec5E027ceFbE7C32d1556dfCc23a7bE32cd#code)

# Important Transaction hashes

Add Liquidity :- [0xa795e7040b3803325354aff66fcbda0e79a7ecbfc0b2e7e474df5bb946f71eec](https://rinkeby.etherscan.io/tx/0xa795e7040b3803325354aff66fcbda0e79a7ecbfc0b2e7e474df5bb946f71eec)

swap Tokens :- [0x934a9ca08cdb4be6109952203907cf29805fe681c28eec587cc5f8409e60c5e1](https://rinkeby.etherscan.io/tx/0x934a9ca08cdb4be6109952203907cf29805fe681c28eec587cc5f8409e60c5e1)

Remove Liquidity :- [0xa1f395c2198047fff44aac840406d9dfa0843c626f78fa6df8c51dc4d87ae1a8](https://rinkeby.etherscan.io/tx/0xa1f395c2198047fff44aac840406d9dfa0843c626f78fa6df8c51dc4d87ae1a8)

# To run tests

we have forked the rinkeby network .For details see hardhat.config.js

to run the tests, first enter the all the necessary env details to a .env files (for details see .env.example files)

then from root directory run,

```
npx hardhat test
```

