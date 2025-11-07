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

to run the tests, first enter the all the necessary env details to a .env files (for details see .env.example files)

then from root directory run,

```
npx hardhat test
```

