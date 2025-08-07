async function main() {
  const [signer] = await ethers.getSigners();
  
  // Replace with your deployed EternalLedger contract address
  const contractAddress = "PASTE_DEPLOYED_ADDRESS_HERE";
  const eternalLedger = await ethers.getContractAt("EternalLedger", contractAddress);

  console.log("Testing Eternal Ledger Functionality...\n");

  try {
    // Get total deaths recorded
    const totalDeaths = await eternalLedger.getTotalDeaths();
    console.log("📊 Total deaths recorded:", totalDeaths.toString());

    if (totalDeaths > 0) {
      // Search by name
      console.log("\n🔍 Searching for 'John Doe':");
      const searchResults = await eternalLedger.searchByName("John Doe");
      console.log("Found token IDs:", searchResults.map(id => id.toString()));

      if (searchResults.length > 0) {
        const tokenId = searchResults[0];
        
        // Get death record
        const record = await eternalLedger.getDeathRecord(tokenId);
        console.log("\n📋 Death Record:");
        console.log("Name:", record.fullName);
        console.log("Birth:", new Date(Number(record.birthDate) * 1000).toDateString());
        console.log("Death:", new Date(Number(record.deathDate) * 1000).toDateString());
        console.log("Location:", record.placeOfDeath);
        console.log("Verified:", record.isVerified);

        // Check if soulbound
        const isLocked = await eternalLedger.locked(tokenId);
        console.log("Is Soulbound:", isLocked);

        // Try to transfer (should fail)
        try {
          const dummyAddress = "0x0000000000000000000000000000000000000001";
          await eternalLedger.transferFrom(signer.address, dummyAddress, tokenId);
          console.log("❌ Transfer succeeded (shouldn't happen!)");
        } catch (error) {
          console.log("✅ Transfer blocked:", error.message.split("(")[0]);
        }

        // Get memorial if exists
        try {
          const memorial = await eternalLedger.getMemorialContent(tokenId);
          if (memorial.title) {
            console.log("\n🕊️ Memorial:");
            console.log("Title:", memorial.title);
            console.log("Description:", memorial.description);
          }
        } catch (error) {
          console.log("No memorial content found");
        }
      }
    }

    // Test role-based access
    console.log("\n🔐 Access Control:");
    const hasIssuerRole = await eternalLedger.hasRole(
      await eternalLedger.VERIFIED_ISSUER_ROLE(), 
      signer.address
    );
    console.log("Has Verified Issuer Role:", hasIssuerRole);

  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
