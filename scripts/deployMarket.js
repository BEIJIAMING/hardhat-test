const hre = require("hardhat");
// npx hardhat run --network sepolia scripts/deployMarket.js
async function main() {
  console.log("deploying...");
  const Market = await hre.ethers.getContractFactory("Market");
  const market = await Market.deploy(
    "0x0496275d34753A48320CA58103d5220d394FF77F"
  );

  await market.deployed();

  console.log(
    "Market contract deployed: ",
    market.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});