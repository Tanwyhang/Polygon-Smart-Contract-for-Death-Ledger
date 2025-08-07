async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Your wallet address:", signer.address);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Current balance:", ethers.formatEther(balance), "MATIC");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
