async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Eternal Ledger with:", deployer.address);

  const EternalLedger = await ethers.getContractFactory("EternalLedger");
  const eternalLedger = await EternalLedger.deploy();
  await eternalLedger.waitForDeployment();

  console.log("EternalLedger deployed to:", await eternalLedger.getAddress());
  
  // Add some verified issuers (example)
  console.log("Setting up verified issuers...");
  // In real deployment, these would be actual hospital/government addresses
  // await eternalLedger.addVerifiedIssuer("0x...");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
