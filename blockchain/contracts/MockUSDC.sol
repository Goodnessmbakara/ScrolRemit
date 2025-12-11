// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for Scroll Sepolia testnet
 * @dev ERC20 token with 6 decimals (matching real USDC)
 * Includes public minting for testnet faucet functionality
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**DECIMALS; // 1000 USDC per request
    
    // Rate limiting for faucet
    mapping(address => uint256) public lastMintTime;
    uint256 public constant MINT_COOLDOWN = 1 days;
    
    /// @notice Emitted when tokens are minted via faucet
    event FaucetMint(address indexed recipient, uint256 amount);
   
    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**DECIMALS); // 1M initial supply
    }
    
    /**
     * @notice Get token decimals (6 like real USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Faucet function - anyone can mint test tokens
     * @dev Rate limited to prevent abuse
     */
    function mint() external {
        require(
            block.timestamp >= lastMintTime[msg.sender] + MINT_COOLDOWN,
            "MockUSDC: Mint cooldown active"
        );
        
        lastMintTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetMint(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @notice Owner can mint any amount for testing
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function ownerMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
