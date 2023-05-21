const hre = require("hardhat");

async function main() {
  console.log("deploying...");
  const Swap = await hre.ethers.getContractFactory("Swap");
  const swap = await Swap.deploy("0x5D2EBDf613D50Dc598A09d8Ebdc3F285bE6CF8ed");

  await swap.deployed();

  console.log("Swap contract deployed: ", swap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});