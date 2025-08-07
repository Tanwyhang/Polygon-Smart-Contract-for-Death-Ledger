# Eternal Ledger - Decentralized Death Registry

This project implements the Eternal Ledger concept: a blockchain-based platform for permanently recording deaths and preserving digital memorials using Soulbound Death Tokens (SDT).

## Overview

Eternal Ledger is a decentralized, immutable registry that allows families, institutions, or trusted witnesses to record deaths on-chain, ensuring permanence, transparency, and global accessibility.

## Features

- **Soulbound Death Tokens (SDT)**: Non-transferable ERC721 tokens representing death records
- **Comprehensive Death Records**: Full name, birth/death dates, location, attestor information
- **Memorial System**: IPFS-based storage for photos, documents, and rich memorial content
- **Role-Based Access Control**: Verified issuers (hospitals, government) and DAO verifiers
- **Global Search**: Search death records by name across the entire registry
- **Duplicate Prevention**: Cryptographic proof system prevents duplicate records
- **EIP-5192 Compliance**: Proper soulbound token implementation

## Quick Start

```shell
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Polygon Amoy testnet
npx hardhat run scripts/deploy_eternal_ledger.js --network amoy

# Record a death (after deployment)
npx hardhat run scripts/record_death.js --network amoy

# Create memorial content
npx hardhat run scripts/create_memorial.js --network amoy
```

## Project Structure

```
contracts/
  └── EternalLedger.sol          # Main death registry contract

scripts/
  ├── deploy_eternal_ledger.js   # Deploy the contract
  ├── record_death.js            # Record a death and mint SDT
  ├── create_memorial.js         # Add memorial content
  ├── test_eternal_ledger.js     # Test all functionality
  └── check_balance.js           # Check wallet balance

test/
  └── EternalLedger.js           # Comprehensive test suite

ignition/modules/
  └── EternalLedger.js           # Hardhat Ignition deployment
```

## Core Concepts

### Soulbound Death Token (SDT)
- Non-transferable token minted to deceased's identity wallet
- Serves as cryptographic proof of death
- Can be referenced by future decentralized systems
- Enables automated status changes (DeFi accounts, pensions, digital wills)

### Memorial NFT System
- Optional rich memorial content storage
- IPFS integration for permanent, decentralized storage
- Support for photos, videos, documents, final wishes
- Family-controlled memorial creation

### Verification System
- Trusted issuer roles for hospitals, government agencies
- DAO-based verification for disputed cases
- Community consensus mechanisms
- Notarized document integration

## Technology Stack

- **Blockchain**: Ethereum/Polygon (EVM compatible)
- **Token Standard**: ERC721 + EIP-5192 (Soulbound)
- **Access Control**: OpenZeppelin AccessControl
- **Storage**: IPFS for memorial content
- **Development**: Hardhat, Ethers.js, Chai

## Network Configuration

The project is configured for Polygon Amoy testnet. Update `.env` with:

```
PRIVATE_KEY=your_wallet_private_key
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
```

## Use Cases

- **Refugee/War Casualty Records**: Immutable records in crisis zones
- **Global Pandemics**: Unified registry during health crises  
- **Diaspora Families**: Cross-border ancestry and legacy preservation
- **Digital Inheritance**: Automated account management post-mortem
- **Historical Records**: Tamper-proof death records for future generations

## Contributing

This project implements the Eternal Ledger concept for decentralized death registration and digital memorial preservation. Feel free to contribute improvements or suggest new features.

## License

MIT
