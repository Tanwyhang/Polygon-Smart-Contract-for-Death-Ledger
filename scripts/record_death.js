async function main() {
  const [signer] = await ethers.getSigners();
  
  // Replace with your deployed EternalLedger contract address
  const contractAddress = "PASTE_DEPLOYED_ADDRESS_HERE";
  const eternalLedger = await ethers.getContractAt("EternalLedger", contractAddress);

  console.log("Recording a death in the Eternal Ledger...\n");

  // Example death record data
  const deathData = {
    to: signer.address, // Mint to deployer's address for testing
    fullName: "John Doe",
    birthDate: Math.floor(new Date("1950-01-15").getTime() / 1000), // Convert to timestamp
    deathDate: Math.floor(new Date("2024-12-01").getTime() / 1000), // Convert to timestamp
    placeOfDeath: "General Hospital, New York",
    proofHash: ethers.keccak256(ethers.toUtf8Bytes("unique_proof_document_hash_123"))
  };

  try {
    // Record the death
    const tx = await eternalLedger.recordDeath(
      deathData.to,
      deathData.fullName,
      deathData.birthDate,
      deathData.deathDate,
      deathData.placeOfDeath,
      deathData.proofHash
    );
    
    const receipt = await tx.wait();
    console.log("✅ Death recorded successfully!");
    console.log("Transaction hash:", tx.hash);
    
    // Get the token ID from the event
    const deathRecordedEvent = receipt.logs.find(log => {
      try {
        const parsedLog = eternalLedger.interface.parseLog(log);
        return parsedLog.name === "DeathRecorded";
      } catch (e) {
        return false;
      }
    });
    
    if (deathRecordedEvent) {
      const parsedEvent = eternalLedger.interface.parseLog(deathRecordedEvent);
      const tokenId = parsedEvent.args.tokenId;
      console.log("SDT Token ID:", tokenId.toString());
      
      // Verify the record was created
      const record = await eternalLedger.getDeathRecord(tokenId);
      console.log("\n📋 Death Record Details:");
      console.log("Name:", record.fullName);
      console.log("Birth Date:", new Date(Number(record.birthDate) * 1000).toDateString());
      console.log("Death Date:", new Date(Number(record.deathDate) * 1000).toDateString());
      console.log("Place of Death:", record.placeOfDeath);
      console.log("Verified:", record.isVerified);
      console.log("Recorded by:", record.attestor);
      
      // Check if token is locked (soulbound)
      const isLocked = await eternalLedger.locked(tokenId);
      console.log("Token is soulbound:", isLocked);
    }

  } catch (error) {
    console.error("❌ Error recording death:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
