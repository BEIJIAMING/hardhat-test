const { expect } = require('chai');
const { ethers } = require('hardhat');

//npx hardhat test test/Flash.js --network sepolia

describe("Flash", () => {
  let flash
  let deployer

  beforeEach(async () => {
    flashaddress = "0x5AD774f4a4Ec54B4aeA773DF64A9BC6EBF6366Cb";
    linkaddress = "0x8a0E31de20651fe58A369fD6f76c21A8FF7f8d42";
    // Setup accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]

    link = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", linkaddress);

    // Load contract 
    flash = await ethers.getContractAt('Flash', flashaddress)
  })
  describe("Show balance", function () {
    it("Should return the right balance", async function () {
      const Linkbalance = await link.balanceOf(deployer.address);
      expect(await link.balanceOf(deployer.address)).to.equal(Linkbalance);

      const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
      console.log("Init MetaMask linkBalance: ", linkbalance);
    });
  });

  describe("TransferToken", function () {
    it("Transfer Token Amount", async function () {
      // Approve the token transfer
      const amount = ethers.utils.parseUnits("1", 18);
      let tx2 = await link.connect(deployer).approve(flashaddress, amount);
      let receipt2 = await tx2.wait();
      let gasUsed2 = receipt2.gasUsed;
      console.log("Gas used for approve: ", gasUsed2.toString());
  
      let tx3 = await link.connect(deployer).transfer(flashaddress, amount);
      let receipt3 = await tx3.wait();
      let gasUsed3 = receipt3.gasUsed;
      console.log("Gas used for transfer: ", gasUsed3.toString());

      const TransferLinkbalance = await link.balanceOf(flashaddress);
      const transferlinkbalance = ethers.utils.formatUnits(TransferLinkbalance, 18);
      console.log('After transfer 1 link, flash contract link balance', transferlinkbalance);
    });
  });

  describe("requestFlashLoan", () => {
    it("Should request a flash loan", async () => {
      const amount = ethers.utils.parseUnits("1", 18);
      let tx1 = await flash.requestFlashLoan(linkaddress, amount);
      let recepit = await tx1.wait();
      let gasUsed = recepit.gasUsed;
      console.log("Gas used for requestFlashLoan: ", gasUsed.toString());

      const Linkbalance = await link.balanceOf(flashaddress);
      const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
      console.log("After requestflashLoan, Flash contract link Balance: ", linkbalance);
    })
  })

  describe("Withdraw", () => {
    it("Should withdraw the flash loan", async () => {
      let tx4 = await flash.withdraw(linkaddress);
      let recepit = await tx4.wait();
      let gasUsed = recepit.gasUsed;
      console.log("Gas used for withdraw: ", gasUsed.toString());

      const Linkbalance = await link.balanceOf(deployer.address);
      const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
      console.log("After withdraw MetaMask Balance: ", linkbalance);
    })
  })
})

