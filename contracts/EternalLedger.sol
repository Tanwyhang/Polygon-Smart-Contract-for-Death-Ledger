// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title Eternal Ledger - Lifecycle Registry
/// @notice Binds identity (NRIC) to wallet, mints SBT on death
/// @dev EIP-5192 compliant Soulbound Token for death certificates. Every token represents a deceased person.
contract EternalLedger is ERC721, Ownable {
    using Strings for uint256;

    struct Record {
        string metadataCID;     // IPFS CID pointing to JSON metadata
        uint256 timestamp;      // Block timestamp when recorded
    }

    // NRIC to wallet mapping for identity binding
    mapping(string => address) public nricToWallet;
    mapping(address => string) public walletToNric;
    
    // Token records and death status
    mapping(uint256 => Record) public records;
    mapping(string => bool) public hasDied;
    
    // Authorized hospitals/registrars
    mapping(address => bool) public authorizedRegistrars;
    
    uint256 public totalSupply;

    // Events
    event IdentityBound(string indexed nric, address indexed wallet);
    event DeathRecorded(string indexed nric, uint256 tokenId, string metadataCID);
    event RegistrarAuthorized(address indexed registrar);
    event RegistrarRevoked(address indexed registrar);

    constructor() ERC721("Eternal Ledger", "ETERNAL") Ownable(msg.sender) {
        // Owner is automatically an authorized registrar
        authorizedRegistrars[msg.sender] = true;
    }

    modifier onlyRegistrar() {
        require(authorizedRegistrars[msg.sender], "Not authorized registrar");
        _;
    }

    /// @notice Authorize a hospital/registrar to bind identities and record deaths
    function authorizeRegistrar(address registrar) external onlyOwner {
        authorizedRegistrars[registrar] = true;
        emit RegistrarAuthorized(registrar);
    }

    /// @notice Revoke registrar authorization
    function revokeRegistrar(address registrar) external onlyOwner {
        authorizedRegistrars[registrar] = false;
        emit RegistrarRevoked(registrar);
    }

    /// @notice Bind NRIC to wallet address (birth registration or eKYC)
    /// @param nric National Registration Identity Card number
    /// @param wallet Wallet address to bind to
    function bindIdentity(string memory nric, address wallet) external onlyRegistrar {
        require(bytes(nric).length > 0, "NRIC cannot be empty");
        require(wallet != address(0), "Invalid wallet address");
        require(nricToWallet[nric] == address(0), "NRIC already bound");
        require(bytes(walletToNric[wallet]).length == 0, "Wallet already bound");

        nricToWallet[nric] = wallet;
        walletToNric[wallet] = nric;
        
        emit IdentityBound(nric, wallet);
    }

    /// @notice Record death and mint Soulbound Token (death certificate)
    /// @param nric NRIC of deceased person
    /// @param metadataCID IPFS CID pointing to JSON metadata containing all death details
    function recordDeath(
        string memory nric,
        string memory metadataCID
    ) external onlyRegistrar {
        require(bytes(nric).length > 0, "NRIC cannot be empty");
        require(nricToWallet[nric] != address(0), "NRIC not registered");
        require(!hasDied[nric], "Already deceased");
        require(bytes(metadataCID).length > 0, "Metadata CID required");

        address recipient = nricToWallet[nric];
        uint256 tokenId = totalSupply + 1;

        // Mint the Soulbound Token to the deceased's wallet
        _safeMint(recipient, tokenId);

        // Store the death record with minimal on-chain data
        records[tokenId] = Record({
            metadataCID: metadataCID,
            timestamp: block.timestamp
        });

        hasDied[nric] = true;
        totalSupply++;

        emit DeathRecorded(nric, tokenId, metadataCID);
    }

    /// @notice Check if a person is deceased by NRIC
    function isDeceased(string memory nric) external view returns (bool) {
        return hasDied[nric];
    }

    /// @notice Get death record by token ID
    function getRecord(uint256 tokenId) external view returns (Record memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return records[tokenId];
    }

    /// @notice Get token ID by NRIC (returns 0 if not deceased)
    function getTokenByNric(string memory nric) external view returns (uint256) {
        if (!hasDied[nric]) return 0;
        
        address wallet = nricToWallet[nric];
        if (wallet == address(0)) return 0;
        
        // Find the token owned by this wallet
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_ownerOf(i) == wallet) {
                return i;
            }
        }
        return 0;
    }

    /// @notice EIP-5192: Check if token is locked (soulbound)
    function locked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return true; // All tokens are soulbound
    }

    /// @notice Get all deceased records (for public registry)
    function getAllDeceased() external view returns (uint256[] memory tokenIds, Record[] memory deceasedRecords) {
        tokenIds = new uint256[](totalSupply);
        deceasedRecords = new Record[](totalSupply);
        
        for (uint256 i = 1; i <= totalSupply; i++) {
            tokenIds[i-1] = i;
            deceasedRecords[i-1] = records[i];
        }
        
        return (tokenIds, deceasedRecords);
    }

    /// @notice Override token URI to return IPFS metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        Record memory record = records[tokenId];
        return string(abi.encodePacked("ipfs://", record.metadataCID));
    }

    // Soulbound: Prevent all transfers by overriding _update
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent all transfers
        require(from == address(0), "Soulbound: non-transferable");
        
        return super._update(to, tokenId, auth);
    }

    // Explicitly block approval functions
    function approve(address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: non-transferable");
    }

    /// @notice Get comprehensive death statistics
    function getDeathStatistics() external view returns (
        uint256 totalDeaths,
        uint256 oldestTokenId,
        uint256 newestTokenId,
        uint256 contractCreationTime
    ) {
        return (
            totalSupply,
            totalSupply > 0 ? 1 : 0,
            totalSupply,
            0 // You could store deployment timestamp if needed
        );
    }

    /// @notice Emergency function to update metadata CID if needed
    function updateMetadataCID(uint256 tokenId, string memory newMetadataCID) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(bytes(newMetadataCID).length > 0, "Metadata CID required");
        
        records[tokenId].metadataCID = newMetadataCID;
    }
}
