// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Compatibility shim: keep the old IPayfundsRouter02 name but forward to IDexRouter02
import "./IDexRouter02.sol";

interface IPayfundsRouter02 is IDexRouter02 {}