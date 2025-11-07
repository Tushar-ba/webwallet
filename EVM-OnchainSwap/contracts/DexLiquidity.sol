// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Interface/IDexRouter02.sol";
import "./Interface/IDexFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title A DEX like contract
/// @author Tanya Srivastava
/// @notice contract helps user to create liquidity pool, add liquidity to the pool, removes liquiidty, swap tokens
/// @dev this contract uses the router and factory contract of Dex and calls the functions from this contract
/// @custom:experimental This is an experimental contract.

contract DexLiquidity {
    /// @dev Dex Router02 contract on amoy network
    address public router = 0x605C6dFF3726cED416CA24428560dC9E4d424940;
    /// @dev Dex Factory contract on amoy network
    address public factory = 0x61742229c8c501ef0657Ff71d1779873ba2a3f9C;

    address public WETH9 = 0xe334852476e9517E32Dfd867fFc485fcd2db2695;

    /// @notice strore the lp tokens of a user
    /// @dev this contract holds all the liquidity of all user
    /// @dev msg.sender and pair address(pool) to the lp token
    /// @return liquidity of a user in a pool
    mapping(address => mapping(address => uint256)) public liquidityOf;

    /// @notice To add liquidity in pool
    /// @notice before calling this func user need to approve the tokenAmounts to this contract from tokenA and tokenB
    /// @dev after adding liquidity user gets some LP tokens , which is stored in this contract
    /// @dev user can check it by calling the liquidityOf func with userAddress,pool address
    /// @param tokenA first token Address
    /// @param tokenB second token Address
    /// @param amountA first token Amount
    /// @param amountB second token Amount
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external {
        require(
            address(0) != tokenA && address(0) != tokenB,
            "Token address cannot be zero address"
        );
        require(
            amountA >= 0 && amountB >= 0,
            "both token amount should be greater than or equal 0"
        );

        /// @dev transfer all the tokens to this contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        /// @dev approve the router contract
        IERC20(tokenA).approve(router, amountA);
        IERC20(tokenB).approve(router, amountB);

        /// @dev call the function addLiquidity in router contract
        (
            uint256 TokenAamount,
            uint256 TokenBamountB,
            uint256 LPToken
        ) = IDexRouter02(router).addLiquidity(
                tokenA,
                tokenB,
                amountA,
                amountB,
                amountAMin,
                amountBMin,
                to,
                block.timestamp + 1000
            );

        /// @dev get the pair address(pool)
        address pair = IDexFactory(factory).getPair(tokenA, tokenB);

        /// @dev emit the event
        emit AddedLiquidity(TokenAamount, TokenBamountB, LPToken, pair);
    }

    /// @notice To add liquidity in pool
    /// @notice before calling this func user need to approve the tokenAmounts to this contract from tokenA and tokenB
    /// @dev after adding liquidity user gets some LP tokens , which is stored in this contract
    /// @dev user can check it by calling the liquidityOf func with userAddress,pool address
    /// @param tokenA first token address
    /// @param amountA first token Amount
    /// @param amountATokenMin amount A token minimum
    /// @param amountETHMin amountETHMin minimum
    /// @param to liquidity token receiver
    function addLiquidityEth(
        address tokenA,
        uint amountA,
        uint amountATokenMin,
        uint amountETHMin,
        address to
    ) external payable {
        require(
            amountA >= 0,
            "both token amount should be greater than or equal 0"
        );

        /// @dev transfer all the tokens to this contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);

        /// @dev approve the router contract
        IERC20(tokenA).approve(router, amountA);

        /// @dev call the function addLiquidity in router contract
        (
            uint256 TokenAamount,
            uint256 amountETH,
            uint256 LPToken
        ) = IDexRouter02(router).addLiquidityETH(
                tokenA,
                amountA,
                amountATokenMin,
                amountETHMin,
                to,
                block.timestamp + 1000
            );

        address pair = IDexFactory(factory).getPair(tokenA, WETH9);
        /// @dev emit the event
        emit AddedLiquidityEth(TokenAamount, amountETH, LPToken, pair);
    }

    /// @notice call this function to remove the liquidity you had provided
    /// @dev this func reverts if caller doesn't have any liquidity to the pool
    /// @dev this func sends the tokens to the caller address
    /// @param tokenA first token address
    /// @param tokenB second token address
    /// @param senderLiquidity user liquidity balance
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 senderLiquidity
    ) external {
        require(
            address(0) != tokenA && address(0) != tokenB,
            "Token address cannot be zero address"
        );

        /// @dev get the liquidity pool (pair)
        address pair = IDexFactory(factory).getPair(tokenA, tokenB);

        /// @dev transfer all the tokens to this contract
        IERC20(pair).transferFrom(msg.sender, address(this), senderLiquidity);

        /// @dev this contracts holds all the liquidity , so contract should approve senders all liquidity to the router contract
        /// @dev approve so that it can send the lp tokens to the pool address and burn it
        IERC20(pair).approve(router, senderLiquidity);

        /// @dev call the remove liquidity function
        /// @dev 1,1 = Token A minimum , Token B minimum
        (uint256 TokenAamount, uint256 TokenBamount) = IDexRouter02(
            router
        ).removeLiquidity(
                tokenA,
                tokenB,
                senderLiquidity,
                1,
                1,
                msg.sender,
                block.timestamp
            );

        /// @dev emit the event
        emit RemovedLiquidity(TokenAamount, TokenBamount, pair);
    }

    /// @notice call the function to swap tokens (ex. tokenA -> tokenB)
    /// @notice caller need to approve the token amount (amount user want to swap) to the contract
    /// @dev after swapping the token ,caller will get the desired tokens to his address
    /// @param fromToken the address of the token user is ready to swap
    /// @param toToken the address of the token user wants to get
    /// @param tokenAmountForSwap the amount of token user wants to swap to get the toToken
    function swapTokens(
        address fromToken,
        address toToken,
        uint256 tokenAmountForSwap,
        uint256 amountOutMin
    ) external {
        address pair = IDexFactory(factory).getPair(fromToken, toToken);

        /// @dev if pool is not exist,revert
        require(pair != address(0), "Pool is not exist");
        /// @dev transfer the tokens from sender address to contract address
        IERC20(fromToken).transferFrom(
            msg.sender,
            address(this),
            tokenAmountForSwap
        );

        /// @dev approve this token for the router contract
        IERC20(fromToken).approve(router, tokenAmountForSwap);

        /// @dev path of swapping the token
        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;
        /// @dev swap the tokns
        uint[] memory amounts = IDexRouter02(router).swapExactTokensForTokens(
            tokenAmountForSwap,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );
        /// @dev emit the event
        emit TokenSwapped(amounts[amounts.length - 1], msg.sender);
    }

    function getAmountsOut(
        address tokenA,
        address tokenB,
        uint256 tokenAmountForSwap
    ) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;

        uint256 tokenAmountOut = IDexRouter02(router).getAmountsOut(
            tokenAmountForSwap,
            path
        )[1];

        return tokenAmountOut;
    }

    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address) {
        address pair = IDexFactory(factory).getPair(tokenA, tokenB);
        return pair;
    }

    /* all events */
    event AddedLiquidity(
        uint256 amountA,
        uint256 amountB,
        uint256 LPToken,
        address PoolAddress
    );

    event AddedLiquidityEth(
        uint256 amountA,
        uint256 amountB,
        uint256 LPToken,
        address pair
    );

    event RemovedLiquidity(
        uint256 amountA,
        uint256 amountB,
        address PoolAddress
    );
    event TokenSwapped(uint256 TokenAmountOut, address tokenReciever);
}
