import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const ProfileRegistryModule = buildModule('ProfileRegistryModule', (m) => {
  // Deploy ProfileRegistry contract
  const profileRegistry = m.contract('ProfileRegistry')

  return { profileRegistry }
})

export default ProfileRegistryModule
