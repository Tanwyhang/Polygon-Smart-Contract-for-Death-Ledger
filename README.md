# EternalLedger - Decentralized Death Registry

A blockchain-based lifecycle registry that manages identity-to-death workflow using **Soulbound Tokens (SBTs)** as tamper-proof digital death certificates.

## 🎯 Key Features

- ✅ **EIP-5192 Compliant Soulbound Tokens** - Non-transferable death certificates
- ✅ **IPFS Integration** - Off-chain metadata storage with on-chain CIDs
- ✅ **Identity Binding** - Links national IDs (NRIC) to wallet addresses
- ✅ **Multi-Registrar Support** - Hospital/authority authorization system
- ✅ **Public Death Registry** - Transparent verification system
- ✅ **Gas Optimized** - Minimal on-chain data storage

## 🏗️ Contract Architecture

### Core Components:
- **Identity Binding**: NRIC ↔ Wallet mapping
- **Death Recording**: Mint SBT with IPFS metadata
- **Public Registry**: Query death status and records
- **Authorization**: Multi-hospital registrar system

### Data Structure:
```solidity
struct Record {
    string metadataCID;     // IPFS hash to JSON metadata
    uint256 timestamp;      // Recording timestamp  
    bool isDeceased;        // Death status flag
}
```

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Compile
```bash
npx hardhat compile
```

### Test
```bash
npx hardhat test
```

### Deploy to Polygon Amoy
```bash
npx hardhat ignition deploy ./ignition/modules/EternalLedger.js --network amoy
```

### Check Balance (before deployment)
```bash
npx hardhat run scripts/check_balance.js --network amoy
```

### Bind Identity (after deployment)
```bash
# Update contract address in scripts/bind_identity.js first
npx hardhat run scripts/bind_identity.js --network amoy
```

## 📁 Project Structure

```
contracts/
├── EternalLedger.sol       # Main soulbound death certificate contract

scripts/
├── check_balance.js        # Check wallet MATIC balance
└── bind_identity.js        # Bind NRIC to wallet address

test/
└── EternalLedger.js        # Contract unit tests

ignition/modules/
└── EternalLedger.js        # Hardhat Ignition deployment module
```

## 🔍 Usage Example

### 1. Bind Identity (Hospital/Registrar)
```javascript
await eternalLedger.bindIdentity("S1234567A", "0x742d35Cc...");
```

### 2. Record Death (Hospital/Registrar)  
```javascript
await eternalLedger.recordDeath("S1234567A", "QmMetadataCID...");
```

### 3. Verify Death Status (Public)
```javascript
const isDeceased = await eternalLedger.isDeceased("S1234567A");
```

### 4. Get Death Certificate (Public)
```javascript
const tokenId = await eternalLedger.getTokenByNric("S1234567A");
const record = await eternalLedger.getRecord(tokenId);
// Fetch full metadata: https://ipfs.io/ipfs/${record.metadataCID}
```

## 📊 IPFS Metadata Schema

```json
{
  "name": "John Doe",
  "birthDate": "1980-01-01",
  "deathDate": "2024-12-01",
  "cause": "Natural causes", 
  "location": "Singapore General Hospital",
  "certificate": "ipfs://QmCertificateDocument...",
  "nextOfKin": "Jane Doe",
  "attributes": [
    {"trait_type": "Death Year", "value": 2024},
    {"trait_type": "Location", "value": "Singapore"}
  ]
}
```

## 🛡️ Security Features

- **Soulbound**: Tokens cannot be transferred or sold
- **Authorized Registrars**: Only hospitals can record deaths  
- **Immutable Records**: Death certificates cannot be altered
- **Public Verification**: Anyone can verify death status

## 🌐 Network Configuration

- **Testnet**: Polygon Amoy (Chain ID: 80002)
- **Mainnet Ready**: Polygon PoS
- **Gas Optimized**: ~290k gas per death record

## 📝 License

MIT License
