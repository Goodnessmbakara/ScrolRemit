// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StreamingPayment
 * @notice Enables continuous payment streams between users
 * @dev Implements time-based token streaming with security controls
 */
contract StreamingPayment is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============
    
    struct Stream {
        address sender;
        address recipient;
        uint256 deposit;          // Total deposited amount
        uint256 ratePerSecond;    // Tokens per second
        uint256 startTime;
        uint256 stopTime;
        uint256 withdrawn;        // Amount already withdrawn
        bool active;
    }

    // ============ State Variables ============
    
    /// @notice The ERC20 token being streamed
    IERC20 public immutable token;
    
    /// @notice Mapping from stream ID to stream struct
    mapping(uint256 => Stream) public streams;
    
    /// @notice Next stream ID
    uint256 public nextStreamId = 1;
    
    // ============ Events ============
    
    event StreamCreated(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 deposit,
        uint256 ratePerSecond,
        uint256 startTime,
        uint256 stopTime
    );
    
    event WithdrawFromStream(
        uint256 indexed streamId,
        address indexed recipient,
        uint256 amount
    );
    
    event CancelStream(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 senderBalance,
        uint256 recipientBalance
    );

    // ============ Errors ============
    
    error InvalidRecipient();
    error InvalidDeposit();
    error InvalidDuration();
    error StreamNotActive();
    error Unauthorized();
    error NoTokensAvailable();

    // ============ Constructor ============
    
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "StreamingPayment: zero address");
        token = IERC20(_token);
    }

    // ============ External Functions ============
    
    /**
     * @notice Create a new payment stream
     * @param recipient The address receiving the stream
     * @param deposit Total amount to be streamed
     * @param duration Stream duration in seconds
     * @return streamId The ID of the created stream
     */
    function createStream(
        address recipient,
        uint256 deposit,
        uint256 duration
    ) external nonReentrant whenNotPaused returns (uint256 streamId) {
        if (recipient == address(0) || recipient == msg.sender) {
            revert InvalidRecipient();
        }
        if (deposit == 0) {
            revert InvalidDeposit();
        }
        if (duration == 0) {
            revert InvalidDuration();
        }

        // Calculate rate per second
        uint256 ratePerSecond = deposit / duration;
        if (ratePerSecond == 0) {
            revert InvalidDeposit();
        }

        // Create stream
        streamId = nextStreamId++;
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + duration;

        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            deposit: deposit,
            ratePerSecond: ratePerSecond,
            startTime: startTime,
            stopTime: stopTime,
            withdrawn: 0,
            active: true
        });

        // Transfer tokens to contract
        token.safeTransferFrom(msg.sender, address(this), deposit);

        emit StreamCreated(
            streamId,
            msg.sender,
            recipient,
            deposit,
            ratePerSecond,
            startTime,
            stopTime
        );
    }

    /**
     * @notice Withdraw available tokens from a stream
     * @param streamId The ID of the stream
     * @return amount The amount withdrawn
     */
    function withdrawFromStream(uint256 streamId)
        external
        nonReentrant
        returns (uint256 amount)
    {
        Stream storage stream = streams[streamId];
        
        if (!stream.active) {
            revert StreamNotActive();
        }
        if (msg.sender != stream.recipient) {
            revert Unauthorized();
        }

        amount = _balanceOf(streamId);
        if (amount == 0) {
            revert NoTokensAvailable();
        }

        stream.withdrawn += amount;
        token.safeTransfer(stream.recipient, amount);

        emit WithdrawFromStream(streamId, stream.recipient, amount);
    }

    /**
     * @notice Cancel a stream and return remaining tokens
     * @param streamId The ID of the stream
     */
    function cancelStream(uint256 streamId) external nonReentrant {
        Stream storage stream = streams[streamId];
        
        if (!stream.active) {
            revert StreamNotActive();
        }
        if (msg.sender != stream.sender && msg.sender != stream.recipient) {
            revert Unauthorized();
        }

        uint256 recipientBalance = _balanceOf(streamId);
        uint256 senderBalance = stream.deposit - stream.withdrawn - recipientBalance;

        stream.active = false;

        // Transfer balances
        if (recipientBalance > 0) {
            token.safeTransfer(stream.recipient, recipientBalance);
        }
        if (senderBalance > 0) {
            token.safeTransfer(stream.sender, senderBalance);
        }

        emit CancelStream(streamId, stream.sender, stream.recipient, senderBalance, recipientBalance);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current withdrawable balance for a stream
     * @param streamId The ID of the stream
     * @return The amount available to withdraw
     */
    function balanceOf(uint256 streamId) external view returns (uint256) {
        return _balanceOf(streamId);
    }

    /**
     * @notice Get detailed stream information
     * @param streamId The ID of the stream
     */
    function getStream(uint256 streamId)
        external
        view
        returns (
            address sender,
            address recipient,
            uint256 deposit,
            uint256 ratePerSecond,
            uint256 startTime,
            uint256 stopTime,
            uint256 withdrawn,
            bool active
        )
    {
        Stream memory stream = streams[streamId];
        return (
            stream.sender,
            stream.recipient,
            stream.deposit,
            stream.ratePerSecond,
            stream.startTime,
            stream.stopTime,
            stream.withdrawn,
            stream.active
        );
    }

    // ============ Internal Functions ============
    
    /**
     * @notice Calculate withdrawable balance for a stream
     * @param streamId The ID of the stream
     */
    function _balanceOf(uint256 streamId) internal view returns (uint256) {
        Stream memory stream = streams[streamId];
        
        if (!stream.active) {
            return 0;
        }

        uint256 elapsedTime;
        if (block.timestamp >= stream.stopTime) {
            elapsedTime = stream.stopTime - stream.startTime;
        } else {
            elapsedTime = block.timestamp - stream.startTime;
        }

        uint256 totalStreamed = elapsedTime * stream.ratePerSecond;
        return totalStreamed - stream.withdrawn;
    }

    // ============ Owner Functions ============
    
    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
