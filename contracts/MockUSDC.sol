// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/// @dev Development token. NEVER used for the Base Sepolia deployment.
contract MockUSDC is ERC20 {
    bool public transfersBlocked;
    constructor() ERC20("Development USDC", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
    function setTransfersBlocked(bool value) external { transfersBlocked = value; }
    function _update(address from, address to, uint256 amount) internal override {
        require(!transfersBlocked || from == address(0), "TransfersBlocked");
        super._update(from, to, amount);
    }
}
