const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EternalLedgerModule", (m) => {
  const eternalLedger = m.contract("EternalLedger");

  return { eternalLedger };
});
