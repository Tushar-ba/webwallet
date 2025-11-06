// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { Origin, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRouterDEX {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

contract crossChainRouter is OApp, OAppOptionsType3 {
    uint16 public constant SWAP = 1;
    
    IRouterDEX public immutable dexRouter;
    address public immutable stablecoin;

    event CrossChainSwapInitiated(
        address indexed sender,
        uint32 destinationEid,
        address recipient,
        address sourceToken,
        address destinationToken,
        uint256 amountIn,
        uint256 stableAmount
    );

    event CrossChainSwapCompleted(
        address indexed recipient,
        address destinationToken,
        uint256 stableAmount,
        uint256 amountOut
    );

    constructor(
        address _endpoint,
        address _owner,
        address _dexRouter,
        address _stablecoin
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        dexRouter = IRouterDEX(_dexRouter);
        stablecoin = _stablecoin;
    }

    function quoteCrossChainSwap(
        uint32 _dstEid,
        address _recipient,
        address _destinationToken,
        uint256 _stableAmount,
        uint256 _amountOutMin,
        bytes calldata _options,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory message = abi.encode(_recipient, _destinationToken, _stableAmount, _amountOutMin);
        bytes memory combinedOptions = combineOptions(_dstEid, SWAP, _options);
        fee = _quote(_dstEid, message, combinedOptions, _payInLzToken);
    }

    function crossChainSwap(
        uint32 _destinationEid,
        address _recipient,
        address _sourceToken,
        address _destinationToken,
        uint256 _amountIn,
        uint256 _amountOutMin,
        bytes calldata _options
    ) external payable {
        require(_amountIn > 0, "Amount must be greater than zero");

        IERC20(_sourceToken).transferFrom(msg.sender, address(this), _amountIn);

        IERC20(_sourceToken).approve(address(dexRouter), _amountIn);

        address[] memory path = new address[](2);
        path[0] = _sourceToken;
        path[1] = stablecoin;

        uint[] memory amounts = dexRouter.swapExactTokensForTokens(
            _amountIn,
            0,
            path,
            address(this),
            block.timestamp + 1200
        );

        uint256 stableAmount = amounts[amounts.length - 1];

        bytes memory message = abi.encode(_recipient, _destinationToken, stableAmount, _amountOutMin);
        bytes memory combinedOptions = combineOptions(_destinationEid, SWAP, _options);

        _lzSend(
            _destinationEid,
            message,
            combinedOptions,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        emit CrossChainSwapInitiated(
            msg.sender,
            _destinationEid,
            _recipient,
            _sourceToken,
            _destinationToken,
            _amountIn,
            stableAmount
        );
    }

    function _lzReceive(
        Origin calldata,
        bytes32,
        bytes calldata _message,
        address,
        bytes calldata
    ) internal override {
        (address recipient, address destinationToken, uint256 stableAmount, uint256 amountOutMin) = 
            abi.decode(_message, (address, address, uint256, uint256));

        _performDestinationSwap(recipient, destinationToken, stableAmount, amountOutMin);
    }

    function _performDestinationSwap(
        address _recipient,
        address _destinationToken,
        uint256 _stableAmount,
        uint256 _amountOutMin
    ) internal {
        require(_recipient != address(0), "Invalid recipient");
        require(_stableAmount > 0, "Invalid amount");
        
        uint256 stablecoinBalance = IERC20(stablecoin).balanceOf(address(this));
        require(stablecoinBalance >= _stableAmount, "Insufficient stablecoin balance");

        if (_destinationToken == stablecoin) {
            IERC20(stablecoin).transfer(_recipient, _stableAmount);
            emit CrossChainSwapCompleted(_recipient, _destinationToken, _stableAmount, _stableAmount);
            return;
        }

        // ✅ ADDED: CrossChainRouter approves DEX to spend its stablecoins
        IERC20(stablecoin).approve(address(dexRouter), _stableAmount);

        address[] memory path = new address[](2);
        path[0] = stablecoin;
        path[1] = _destinationToken;

        try dexRouter.swapExactTokensForTokens(
            _stableAmount,
            _amountOutMin,
            path,
            _recipient,
            block.timestamp + 1200
        ) returns (uint[] memory amounts) {
            uint256 amountOut = amounts[amounts.length - 1];
            emit CrossChainSwapCompleted(_recipient, _destinationToken, _stableAmount, amountOut);
        } catch {
            IERC20(stablecoin).transfer(_recipient, _stableAmount);
            emit CrossChainSwapCompleted(_recipient, stablecoin, _stableAmount, _stableAmount);
        }
    }

    function estimateSwapOutput(
        address _sourceToken,
        uint256 _amountIn
    ) external view returns (uint256 stableAmount) {
        address[] memory path = new address[](2);
        path[0] = _sourceToken;
        path[1] = stablecoin;

        uint[] memory amounts = dexRouter.getAmountsOut(_amountIn, path);
        stableAmount = amounts[amounts.length - 1];
    }

    function withdrawToken(IERC20 _token, address _to, uint256 _amount) external onlyOwner {
        _token.transfer(_to, _amount);
    }

    function withdrawNative(address payable _to, uint256 _amount) external onlyOwner {
        _to.transfer(_amount);
    }

    receive() external payable {}
}