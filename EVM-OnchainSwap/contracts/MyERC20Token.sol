//SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20Token is ERC20, Ownable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint _initialSupply
    ) ERC20(_name, _symbol) {
        _mint(owner(), _initialSupply * (10 ** (decimals())));
    }

    function mint(uint _amount) public {
        _mint(msg.sender, _amount * (10 ** (decimals())));
    }

    function burn(uint _tokenAmount) public onlyOwner {
        _burn(owner(), _tokenAmount);
    }

    function decimals() public pure override returns (uint8) {
        return 9;
    }
}
