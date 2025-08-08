async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Replace with your deployed contract address
  const contractAddress = "0x05fea25b9d39Bb0068E097Eec63dF8dBd2Ea98Aa";
  const eternalLedger = await ethers.getContractAt("EternalLedger", contractAddress);

  console.log("=== ETERNAL LEDGER STATISTICS ===\n");
  
  try {
    // Get total deaths
    const totalDeaths = await eternalLedger.totalSupply();
    console.log(`📊 Total Death Certificates Minted: ${totalDeaths}`);
    console.log(`💀 Total People Deceased: ${totalDeaths}`);
    
    if (totalDeaths.toString() === "0") {
      console.log("ℹ️  No deaths recorded yet.");
      return;
    }
    
    // Get contract info
    const contractName = await eternalLedger.name();
    const contractSymbol = await eternalLedger.symbol();
    console.log(`\n📜 Contract: ${contractName} (${contractSymbol})`);
    console.log(`📍 Address: ${contractAddress}`);
    
    // Calculate statistics
    console.log("\n=== STATISTICS ===");
    console.log(`🔢 Token IDs: 1 to ${totalDeaths}`);
    
    // Get recent deaths (last 5)
    const recentLimit = Math.min(5, Number(totalDeaths));
    console.log(`\n📈 Recent Deaths (Last ${recentLimit}):`);
    
    for (let i = Number(totalDeaths); i > Number(totalDeaths) - recentLimit; i--) {
      try {
        const record = await eternalLedger.getRecord(i);
        const owner = await eternalLedger.ownerOf(i);
        const timestamp = new Date(Number(record.timestamp) * 1000);
        
        console.log(`  Token ${i}:`);
        console.log(`    📅 Recorded: ${timestamp.toLocaleString()}`);
        console.log(`    👤 Certificate Holder: ${owner}`);
        console.log(`    🗂️  Metadata: ipfs://${record.metadataCID}`);
        console.log(`    ─────────────────────────────`);
      } catch (error) {
        console.log(`  Token ${i}: Error reading record`);
      }
    }
    
    // Network info
    const network = await ethers.provider.getNetwork();
    console.log(`\n🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
  } catch (error) {
    console.error("❌ Error accessing contract:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
