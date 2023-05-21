const hre = require("hardhat");

async function main() {
  const Flash = await hre.ethers.getContractFactory("Flash");
  const flash = await Flash.deploy("0x0496275d34753A48320CA58103d5220d394FF77F"); // PoolAddressesProvider-Aave-Sepolia

  await flash.deployed();
  console.log("Flash contract deployed: ", flash.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
