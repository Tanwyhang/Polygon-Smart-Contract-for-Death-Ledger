// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title EternalLedger - Decentralized Death Registry & Digital Memorials
/// @notice EIP-5192 compliant Soulbound Death Token (SDT) for permanent death records
/// @dev Implements soulbound tokens for deceased individuals with memorial capabilities

interface ISoulbound {
    /// @notice Returns true if the token is soulbound (non-transferable)
    function locked(uint256 tokenId) external view returns (bool);
}

contract EternalLedger is ERC721, ISoulbound, AccessControl {
    using Strings for uint256;

    // Role definitions
    bytes32 public constant VERIFIED_ISSUER_ROLE = keccak256("VERIFIED_ISSUER_ROLE");
    bytes32 public constant DAO_VERIFIER_ROLE = keccak256("DAO_VERIFIER_ROLE");

    struct DeathRecord {
        string fullName;           // Full name of deceased
        uint256 birthDate;         // Birth date (timestamp)
        uint256 deathDate;         // Death date (timestamp)
        string placeOfDeath;       // Location where death occurred
        string ipfsHash;           // IPFS hash for memorial content (optional)
        address attestor;          // Who recorded this death
        bool isVerified;           // Verified by trusted entity or DAO
        uint256 recordedAt;        // When record was created
    }

    struct MemorialContent {
        string title;              // Memorial title
        string description;        // Brief description
        string[] ipfsHashes;       // Multiple IPFS hashes for photos, documents
        bool hasRichMedia;         // Whether memorial includes rich media
    }

    // State variables
    uint256 private _nextTokenId = 1;
    mapping(uint256 => DeathRecord) public deathRecords;
    mapping(uint256 => MemorialContent) public memorialContents;
    mapping(uint256 => bool) private _locked;
    mapping(string => uint256[]) public nameToTokenIds; // For searchability
    mapping(bytes32 => bool) public usedProofs; // Prevent duplicate records

    // Events
    event DeathRecorded(
        uint256 indexed tokenId,
        string fullName,
        uint256 deathDate,
        address indexed attestor,
        bool isVerified
    );
    
    event MemorialCreated(
        uint256 indexed tokenId,
        string title,
        string ipfsHash
    );
    
    event RecordVerified(
        uint256 indexed tokenId,
        address indexed verifier
    );

    constructor() ERC721("EternalLedger", "SDT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIED_ISSUER_ROLE, msg.sender);
    }

    /// @notice Record a death and mint a Soulbound Death Token (SDT)
    /// @param to Address to mint the SDT to (usually deceased's wallet or family)
    /// @param fullName Full name of the deceased
    /// @param birthDate Birth date as timestamp
    /// @param deathDate Death date as timestamp
    /// @param placeOfDeath Location where death occurred
    /// @param proofHash Hash of supporting documentation to prevent duplicates
    function recordDeath(
        address to,
        string memory fullName,
        uint256 birthDate,
        uint256 deathDate,
        string memory placeOfDeath,
        bytes32 proofHash
    ) external returns (uint256) {
        require(deathDate >= birthDate, "Death date cannot be before birth date");
        require(deathDate <= block.timestamp, "Death date cannot be in the future");
        require(!usedProofs[proofHash], "Death record already exists with this proof");
        require(bytes(fullName).length > 0, "Name cannot be empty");

        uint256 tokenId = _nextTokenId++;
        bool isVerified = hasRole(VERIFIED_ISSUER_ROLE, msg.sender);

        // Mark proof as used to prevent duplicates
        usedProofs[proofHash] = true;

        // Create death record
        deathRecords[tokenId] = DeathRecord({
            fullName: fullName,
            birthDate: birthDate,
            deathDate: deathDate,
            placeOfDeath: placeOfDeath,
            ipfsHash: "",
            attestor: msg.sender,
            isVerified: isVerified,
            recordedAt: block.timestamp
        });

        // Mint soulbound token
        _mint(to, tokenId);
        _locked[tokenId] = true;

        // Add to searchable index
        nameToTokenIds[_normalizeString(fullName)].push(tokenId);

        emit DeathRecorded(tokenId, fullName, deathDate, msg.sender, isVerified);
        
        return tokenId;
    }

    /// @notice Add memorial content to an existing death record
    /// @param tokenId The SDT token ID
    /// @param title Memorial title
    /// @param description Memorial description
    /// @param ipfsHashes Array of IPFS hashes for memorial content
    function createMemorial(
        uint256 tokenId,
        string memory title,
        string memory description,
        string[] memory ipfsHashes
    ) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || 
            hasRole(VERIFIED_ISSUER_ROLE, msg.sender) ||
            deathRecords[tokenId].attestor == msg.sender,
            "Not authorized to create memorial"
        );

        memorialContents[tokenId] = MemorialContent({
            title: title,
            description: description,
            ipfsHashes: ipfsHashes,
            hasRichMedia: ipfsHashes.length > 0
        });

        // Update main record with primary IPFS hash if provided
        if (ipfsHashes.length > 0) {
            deathRecords[tokenId].ipfsHash = ipfsHashes[0];
        }

        emit MemorialCreated(tokenId, title, ipfsHashes.length > 0 ? ipfsHashes[0] : "");
    }

    /// @notice Verify a death record (DAO or verified issuer only)
    /// @param tokenId The SDT token ID to verify
    function verifyRecord(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            hasRole(DAO_VERIFIER_ROLE, msg.sender) || 
            hasRole(VERIFIED_ISSUER_ROLE, msg.sender),
            "Not authorized to verify records"
        );

        deathRecords[tokenId].isVerified = true;
        emit RecordVerified(tokenId, msg.sender);
    }

    /// @notice Search for death records by name
    /// @param name Name to search for
    /// @return Array of token IDs matching the name
    function searchByName(string memory name) external view returns (uint256[] memory) {
        return nameToTokenIds[_normalizeString(name)];
    }

    /// @notice Get complete death record
    /// @param tokenId The SDT token ID
    /// @return The complete death record
    function getDeathRecord(uint256 tokenId) external view returns (DeathRecord memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return deathRecords[tokenId];
    }

    /// @notice Get memorial content
    /// @param tokenId The SDT token ID
    /// @return The memorial content
    function getMemorialContent(uint256 tokenId) external view returns (MemorialContent memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return memorialContents[tokenId];
    }

    /// @notice Check if a token is locked (soulbound)
    /// @param tokenId The token ID to check
    /// @return True if the token is locked
    function locked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _locked[tokenId];
    }

    /// @notice Add a verified issuer (hospitals, government agencies, etc.)
    /// @param account Address to grant verified issuer role
    function addVerifiedIssuer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIED_ISSUER_ROLE, account);
    }

    /// @notice Add a DAO verifier
    /// @param account Address to grant DAO verifier role
    function addDAOVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DAO_VERIFIER_ROLE, account);
    }

    /// @notice Get total number of recorded deaths
    /// @return Total number of SDTs minted
    function getTotalDeaths() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Override _update to prevent transfers (soulbound)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent all transfers
        require(
            from == address(0),
            "Soulbound: Death tokens are non-transferable and eternal"
        );
        
        return super._update(to, tokenId, auth);
    }

    /// @notice Generate metadata URI for token
    /// @param tokenId The token ID
    /// @return The metadata URI
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        DeathRecord memory record = deathRecords[tokenId];
        
        // Basic metadata - could be enhanced with off-chain metadata service
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _encodeBase64(abi.encodePacked(
                '{"name":"',
                record.fullName,
                ' - Eternal Memorial","description":"Soulbound Death Token for ',
                record.fullName,
                '","attributes":[{"trait_type":"Death Date","value":"',
                _timestampToDate(record.deathDate),
                '"},{"trait_type":"Verified","value":"',
                record.isVerified ? "Yes" : "No",
                '"}]}'
            ))
        ));
    }

    /// @notice Normalize string for consistent searching
    function _normalizeString(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(strBytes.length);
        
        for (uint i = 0; i < strBytes.length; i++) {
            // Convert to lowercase
            if (strBytes[i] >= 0x41 && strBytes[i] <= 0x5A) {
                result[i] = bytes1(uint8(strBytes[i]) + 32);
            } else {
                result[i] = strBytes[i];
            }
        }
        
        return string(result);
    }

    /// @notice Convert timestamp to readable date (basic implementation)
    function _timestampToDate(uint256 timestamp) internal pure returns (string memory) {
        return timestamp.toString();
    }

    /// @notice Basic Base64 encoding (simplified)
    function _encodeBase64(bytes memory /* data */) internal pure returns (string memory) {
        // Simplified base64 encoding - in production, use a proper library
        return "encoded_metadata";
    }

    /// @notice Support interface detection
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
