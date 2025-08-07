async function main() {
  const [signer] = await ethers.getSigners();
  
  // Replace with your deployed EternalLedger contract address
  const contractAddress = "PASTE_DEPLOYED_ADDRESS_HERE";
  const eternalLedger = await ethers.getContractAt("EternalLedger", contractAddress);

  console.log("Creating a memorial for SDT Token...\n");

  // Memorial data
  const tokenId = 1; // Assuming this is the first token minted
  const memorialData = {
    title: "In Loving Memory of John Doe",
    description: "A beloved father, husband, and friend who touched many lives with his kindness and wisdom.",
    ipfsHashes: [
      "QmYourMemorialPhotoHash123",
      "QmYourMemorialVideoHash456", 
      "QmYourMemorialDocumentHash789"
    ]
  };

  try {
    // Create memorial
    const tx = await eternalLedger.createMemorial(
      tokenId,
      memorialData.title,
      memorialData.description,
      memorialData.ipfsHashes
    );
    
    await tx.wait();
    console.log("✅ Memorial created successfully!");
    console.log("Transaction hash:", tx.hash);
    
    // Get the memorial content
    const memorial = await eternalLedger.getMemorialContent(tokenId);
    console.log("\n🕊️ Memorial Details:");
    console.log("Title:", memorial.title);
    console.log("Description:", memorial.description);
    console.log("Has Rich Media:", memorial.hasRichMedia);
    console.log("IPFS Hashes:", memorial.ipfsHashes);

  } catch (error) {
    console.error("❌ Error creating memorial:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
