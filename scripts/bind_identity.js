async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Replace with your deployed contract address
  const contractAddress = "0x05fea25b9d39Bb0068E097Eec63dF8dBd2Ea98Aa";
  const eternalLedger = await ethers.getContractAt("EternalLedger", contractAddress);

  // Example: Bind a test identity
  const testNric = "S1234567A";
  const testWallet = "0xe5d1D5e8e5c772Bbb73caeb2381bb38E77bD9ec8"; // Your wallet
  
  console.log("Binding identity...");
  console.log("NRIC:", testNric);
  console.log("Wallet:", testWallet);
  
  const tx = await eternalLedger.bindIdentity(testNric, testWallet);
  await tx.wait();

  console.log("Identity bound successfully!");
  console.log("Transaction hash:", tx.hash);
  
  // Verify the binding`
  const boundWallet = await eternalLedger.nricToWallet(testNric);
  const boundNric = await eternalLedger.walletToNric(testWallet);
  
  console.log("Verification:");
  console.log("NRIC", testNric, "is bound to wallet:", boundWallet);
  console.log("Wallet", testWallet, "is bound to NRIC:", boundNric);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
