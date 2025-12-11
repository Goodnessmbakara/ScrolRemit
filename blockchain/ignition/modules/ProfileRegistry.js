const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules")

module.exports = buildModule("ProfileRegistryModule", (m) => {
  // Deploy ProfileRegistry contract
  const profileRegistry = m.contract("ProfileRegistry", [])

  return { profileRegistry }
})
