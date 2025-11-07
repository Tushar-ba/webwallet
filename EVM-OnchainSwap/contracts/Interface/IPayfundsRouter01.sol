// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Compatibility shim: IPayfundsRouter01 name retained for backwards compatibility.
// It forwards to the new IDexRouter01 interface so existing imports still work.
import "./IDexRouter01.sol";

interface IPayfundsRouter01 is IDexRouter01 {}