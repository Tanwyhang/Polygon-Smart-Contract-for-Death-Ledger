const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EternalLedger", function () {
  let eternalLedger;
  let owner;
  let hospital;
  let user1;

  beforeEach(async function () {
    [owner, hospital, user1] = await ethers.getSigners();
    
    const EternalLedger = await ethers.getContractFactory("EternalLedger");
    eternalLedger = await EternalLedger.deploy();
    await eternalLedger.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await eternalLedger.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await eternalLedger.name()).to.equal("Eternal Ledger");
      expect(await eternalLedger.symbol()).to.equal("ETERNAL");
    });
  });

  describe("Identity Binding", function () {
    it("Should allow owner to bind identity", async function () {
      const nric = "S1234567A";
      await eternalLedger.bindIdentity(nric, user1.address);
      
      expect(await eternalLedger.nricToWallet(nric)).to.equal(user1.address);
      expect(await eternalLedger.walletToNric(user1.address)).to.equal(nric);
    });
  });

  describe("Death Recording", function () {
    const nric = "S1234567A";
    const metadataCID = "QmTestMetadata123";

    beforeEach(async function () {
      await eternalLedger.bindIdentity(nric, user1.address);
    });

    it("Should record death and mint SBT", async function () {
      await eternalLedger.recordDeath(nric, metadataCID);

      expect(await eternalLedger.balanceOf(user1.address)).to.equal(1);
      expect(await eternalLedger.ownerOf(1)).to.equal(user1.address);
      expect(await eternalLedger.hasDied(nric)).to.be.true;
    });

    it("Should store correct metadata CID", async function () {
      await eternalLedger.recordDeath(nric, metadataCID);

      const record = await eternalLedger.getRecord(1);
      expect(record.metadataCID).to.equal(metadataCID);
      expect(record.timestamp).to.be.gt(0);
    });
  });

  describe("Soulbound functionality", function () {
    const nric = "S1234567A";

    beforeEach(async function () {
      await eternalLedger.bindIdentity(nric, user1.address);
      await eternalLedger.recordDeath(nric, "QmTestMetadata123");
    });

    it("Should return true for locked tokens", async function () {
      expect(await eternalLedger.locked(1)).to.be.true;
    });

    it("Should prevent approvals", async function () {
      await expect(
        eternalLedger.connect(user1).approve(owner.address, 1)
      ).to.be.revertedWith("Soulbound: non-transferable");
    });
  });
});
