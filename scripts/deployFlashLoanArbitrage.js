// npx hardhat run scripts/deployFlashLoanArbitrage.js  --network goerli

// FlashLoanArbitrage contract deployed:  0x03C6836301cB29552503984e3420C97BDeF901a2
const hre = require("hardhat");

async function main() {
  const FlashLoanArbitrage = await hre.ethers.getContractFactory("FlashLoanArbitrage");
  // const flashloanarbitrage = await FlashLoanArbitrage.deploy("0xC911B590248d127aD18546B186cC6B324e99F02c"); // PoolAddressesProvider-Aave-Goerli
  const flashloanarbitrage = await FlashLoanArbitrage.deploy("0x0496275d34753A48320CA58103d5220d394FF77F"); // PoolAddressesProvider-Aave-Sepolia
  0x0496275d34753A48320CA58103d5220d394FF77F
  await flashloanarbitrage.deployed();
  console.log("FlashLoanArbitrage contract deployed: ", flashloanarbitrage.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
