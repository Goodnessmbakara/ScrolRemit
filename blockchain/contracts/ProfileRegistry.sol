// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProfileRegistry
 * @notice Stores IPFS CIDs for user profiles, enabling persistent profile data across sessions
 * @dev Maps wallet addresses to their profile metadata stored on IPFS
 */
contract ProfileRegistry {
    // ============ State Variables ============
    
    /// @notice Mapping from user address to their profile IPFS CID
    mapping(address => string) public profileCIDs;
    
    /// @notice Mapping from username to wallet address (for lookups)
    mapping(string => address) public usernameToAddress;
    
    /// @notice Mapping from address to username (reverse lookup)
    mapping(address => string) public addressToUsername;
    
    /// @notice Total number of registered profiles
    uint256 public totalProfiles;
    
    // ============ Events ============
    
    /// @notice Emitted when a user creates or updates their profile
    event ProfileUpdated(
        address indexed user,
        string cid,
        string username,
        uint256 timestamp
    );
    
    /// @notice Emitted when a user deletes their profile
    event ProfileDeleted(
        address indexed user,
        string username,
        uint256 timestamp
    );
    
    // ============ Errors ============
    
    error EmptyCID();
    error EmptyUsername();
    error UsernameTaken(string username);
    error UsernameInvalid(string username);
    error ProfileNotFound(address user);
    
    // ============ Modifiers ============
    
    modifier validUsername(string memory username) {
        if (bytes(username).length == 0) revert EmptyUsername();
        if (bytes(username).length > 32) revert UsernameInvalid(username);
        
        // Check if username is already taken by someone else
        address existingOwner = usernameToAddress[username];
        if (existingOwner != address(0) && existingOwner != msg.sender) {
            revert UsernameTaken(username);
        }
        _;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Set or update profile for the caller
     * @param cid IPFS CID where profile metadata is stored
     * @param username Unique username for the profile
     */
    function setProfile(
        string calldata cid,
        string calldata username
    ) external validUsername(username) {
        if (bytes(cid).length == 0) revert EmptyCID();
        
        // If user is changing username, clear old mapping
        string memory oldUsername = addressToUsername[msg.sender];
        if (bytes(oldUsername).length > 0 && keccak256(bytes(oldUsername)) != keccak256(bytes(username))) {
            delete usernameToAddress[oldUsername];
        }
        
        // If this is a new profile, increment counter
        if (bytes(profileCIDs[msg.sender]).length == 0) {
            totalProfiles++;
        }
        
        // Store new profile data
        profileCIDs[msg.sender] = cid;
        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;
        
        emit ProfileUpdated(msg.sender, cid, username, block.timestamp);
    }
    
    /**
     * @notice Delete profile for the caller
     */
    function deleteProfile() external {
        string memory cid = profileCIDs[msg.sender];
        if (bytes(cid).length == 0) revert ProfileNotFound(msg.sender);
        
        string memory username = addressToUsername[msg.sender];
        
        // Clear all mappings
        delete profileCIDs[msg.sender];
        delete usernameToAddress[username];
        delete addressToUsername[msg.sender];
        
        totalProfiles--;
        
        emit ProfileDeleted(msg.sender, username, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get profile CID for a user address
     * @param user Address to query
     * @return IPFS CID of the profile
     */
    function getProfile(address user) external view returns (string memory) {
        return profileCIDs[user];
    }
    
    /**
     * @notice Get profile CID by username
     * @param username Username to query
     * @return IPFS CID of the profile
     */
    function getProfileByUsername(string calldata username) external view returns (string memory) {
        address user = usernameToAddress[username];
        if (user == address(0)) revert ProfileNotFound(address(0));
        return profileCIDs[user];
    }
    
    /**
     * @notice Get username for an address
     * @param user Address to query
     * @return Username of the user
     */
    function getUsername(address user) external view returns (string memory) {
        return addressToUsername[user];
    }
    
    /**
     * @notice Check if a username is available
     * @param username Username to check
     * @return true if available, false if taken
     */
    function isUsernameAvailable(string calldata username) external view returns (bool) {
        return usernameToAddress[username] == address(0);
    }
    
    /**
     * @notice Check if an address has a profile
     * @param user Address to check
     * @return true if profile exists, false otherwise
     */
    function hasProfile(address user) external view returns (bool) {
        return bytes(profileCIDs[user]).length > 0;
    }
}
