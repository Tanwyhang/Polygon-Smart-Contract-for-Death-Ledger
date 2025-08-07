const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EternalLedger", function () {
  let eternalLedger;
  let owner;
  let addr1;
  let addr2;
  let verifiedIssuer;

  beforeEach(async function () {
    [owner, addr1, addr2, verifiedIssuer] = await ethers.getSigners();
    
    const EternalLedger = await ethers.getContractFactory("EternalLedger");
    eternalLedger = await EternalLedger.deploy();
    await eternalLedger.waitForDeployment();

    // Add verified issuer role
    await eternalLedger.addVerifiedIssuer(verifiedIssuer.address);
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const DEFAULT_ADMIN_ROLE = await eternalLedger.DEFAULT_ADMIN_ROLE();
      expect(await eternalLedger.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct name and symbol", async function () {
      expect(await eternalLedger.name()).to.equal("EternalLedger");
      expect(await eternalLedger.symbol()).to.equal("SDT");
    });
  });

  describe("Death Recording", function () {
    const deathData = {
      fullName: "John Doe",
      birthDate: Math.floor(new Date("1950-01-15").getTime() / 1000),
      deathDate: Math.floor(new Date("2024-12-01").getTime() / 1000),
      placeOfDeath: "General Hospital, New York",
      proofHash: ethers.keccak256(ethers.toUtf8Bytes("unique_proof_123"))
    };

    it("Should allow death recording", async function () {
      await eternalLedger.recordDeath(
        addr1.address,
        deathData.fullName,
        deathData.birthDate,
        deathData.deathDate,
        deathData.placeOfDeath,
        deathData.proofHash
      );

      expect(await eternalLedger.balanceOf(addr1.address)).to.equal(1);
      expect(await eternalLedger.getTotalDeaths()).to.equal(1);
    });

    it("Should mark verified issuer records as verified", async function () {
      await eternalLedger.connect(verifiedIssuer).recordDeath(
        addr1.address,
        deathData.fullName,
        deathData.birthDate,
        deathData.deathDate,
        deathData.placeOfDeath,
        deathData.proofHash
      );

      const record = await eternalLedger.getDeathRecord(1);
      expect(record.isVerified).to.be.true;
    });

    it("Should prevent duplicate death records", async function () {
      await eternalLedger.recordDeath(
        addr1.address,
        deathData.fullName,
        deathData.birthDate,
        deathData.deathDate,
        deathData.placeOfDeath,
        deathData.proofHash
      );

      await expect(
        eternalLedger.recordDeath(
          addr2.address,
          "Jane Doe",
          deathData.birthDate,
          deathData.deathDate,
          deathData.placeOfDeath,
          deathData.proofHash // Same proof hash
        )
      ).to.be.revertedWith("Death record already exists with this proof");
    });

    it("Should validate death date logic", async function () {
      // Death before birth
      await expect(
        eternalLedger.recordDeath(
          addr1.address,
          deathData.fullName,
          deathData.deathDate, // Death date as birth
          deathData.birthDate, // Birth date as death
          deathData.placeOfDeath,
          deathData.proofHash
        )
      ).to.be.revertedWith("Death date cannot be before birth date");

      // Future death date
      const futureDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
      await expect(
        eternalLedger.recordDeath(
          addr1.address,
          deathData.fullName,
          deathData.birthDate,
          futureDate,
          deathData.placeOfDeath,
          deathData.proofHash
        )
      ).to.be.revertedWith("Death date cannot be in the future");
    });
  });

  describe("Soulbound functionality", function () {
    beforeEach(async function () {
      const deathData = {
        fullName: "John Doe",
        birthDate: Math.floor(new Date("1950-01-15").getTime() / 1000),
        deathDate: Math.floor(new Date("2024-12-01").getTime() / 1000),
        placeOfDeath: "General Hospital, New York",
        proofHash: ethers.keccak256(ethers.toUtf8Bytes("unique_proof_123"))
      };

      await eternalLedger.recordDeath(
        addr1.address,
        deathData.fullName,
        deathData.birthDate,
        deathData.deathDate,
        deathData.placeOfDeath,
        deathData.proofHash
      );
    });

    it("Should prevent all transfers", async function () {
      await expect(
        eternalLedger.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWith("Soulbound: Death tokens are non-transferable and eternal");
    });

    it("Should return true for locked tokens", async function () {
      expect(await eternalLedger.locked(1)).to.be.true;
    });
  });

  describe("Memorial System", function () {
    beforeEach(async function () {
      const deathData = {
        fullName: "John Doe",
        birthDate: Math.floor(new Date("1950-01-15").getTime() / 1000),
        deathDate: Math.floor(new Date("2024-12-01").getTime() / 1000),
        placeOfDeath: "General Hospital, New York",
        proofHash: ethers.keccak256(ethers.toUtf8Bytes("unique_proof_123"))
      };

      await eternalLedger.recordDeath(
        addr1.address,
        deathData.fullName,
        deathData.birthDate,
        deathData.deathDate,
        deathData.placeOfDeath,
        deathData.proofHash
      );
    });

    it("Should allow memorial creation by token owner", async function () {
      await eternalLedger.connect(addr1).createMemorial(
        1,
        "In Loving Memory",
        "A beloved father and friend",
        ["QmHash1", "QmHash2"]
      );

      const memorial = await eternalLedger.getMemorialContent(1);
      expect(memorial.title).to.equal("In Loving Memory");
      expect(memorial.hasRichMedia).to.be.true;
    });

    it("Should prevent unauthorized memorial creation", async function () {
      await expect(
        eternalLedger.connect(addr2).createMemorial(
          1,
          "Unauthorized Memorial",
          "Description",
          []
        )
      ).to.be.revertedWith("Not authorized to create memorial");
    });
  });

  describe("Search Functionality", function () {
    beforeEach(async function () {
      // Record multiple deaths
      await eternalLedger.recordDeath(
        addr1.address,
        "John Doe",
        Math.floor(new Date("1950-01-15").getTime() / 1000),
        Math.floor(new Date("2024-12-01").getTime() / 1000),
        "Hospital A",
        ethers.keccak256(ethers.toUtf8Bytes("proof1"))
      );

      await eternalLedger.recordDeath(
        addr2.address,
        "Jane Doe",
        Math.floor(new Date("1955-03-20").getTime() / 1000),
        Math.floor(new Date("2024-11-15").getTime() / 1000),
        "Hospital B",
        ethers.keccak256(ethers.toUtf8Bytes("proof2"))
      );
    });

    it("Should find records by name", async function () {
      const results = await eternalLedger.searchByName("John Doe");
      expect(results.length).to.equal(1);
      expect(results[0]).to.equal(1);
    });

    it("Should handle case-insensitive search", async function () {
      const results = await eternalLedger.searchByName("john doe");
      expect(results.length).to.equal(1);
    });
  });

  describe("Verification System", function () {
    beforeEach(async function () {
      await eternalLedger.recordDeath(
        addr1.address,
        "John Doe",
        Math.floor(new Date("1950-01-15").getTime() / 1000),
        Math.floor(new Date("2024-12-01").getTime() / 1000),
        "Hospital",
        ethers.keccak256(ethers.toUtf8Bytes("proof1"))
      );
    });

    it("Should allow verified issuers to verify records", async function () {
      await eternalLedger.connect(verifiedIssuer).verifyRecord(1);
      
      const record = await eternalLedger.getDeathRecord(1);
      expect(record.isVerified).to.be.true;
    });

    it("Should prevent unauthorized verification", async function () {
      await expect(
        eternalLedger.connect(addr2).verifyRecord(1)
      ).to.be.revertedWith("Not authorized to verify records");
    });
  });
});
