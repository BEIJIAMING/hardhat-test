const { expect } = require('chai');
const { ethers } = require('hardhat');

// npx hardhat test test/Swap.js --network goerli  

describe('Swap', () => {
  let deployer, accounts, swap, iweth, idai

  beforeEach(async () => {
    swapaddress = "0x5D2EBDf613D50Dc598A09d8Ebdc3F285bE6CF8ed";
    uniRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    sushiRouterAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

    iwethaddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    idaiaddress = "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60";

    // Setup accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]

    // Load contracts
    swap = await ethers.getContractAt('Swap', swapaddress)
  
    // console.log('Swap contract deployed: ', swap.address);

    iweth = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", iwethaddress);

    idai = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", idaiaddress);
  })

  describe("Show iweth balance", function () {
    it("Should return the right balance", async function () {
      const iwethbalance = await iweth.balanceOf(deployer.address);
      expect(await iweth.balanceOf(deployer.address)).to.equal(iwethbalance);
      console.log("MetaMask weth Balance: ", ethers.utils.formatUnits(iwethbalance, 18));
    });
  });

  describe("ApproveToken", function () { 
    it("Approve Token Amount", async function () {
      const iwethamount = ethers.utils.parseUnits("0.00001", 18);
      const daiamount = ethers.utils.parseUnits("1", 18);

      let tx2 = await iweth.connect(deployer).approve(swapaddress, iwethamount);
      await tx2.wait();

      let tx4 = await idai.connect(deployer).approve(swapaddress, daiamount);
      await tx4.wait();
    });
  });

  describe("TransferToken", function () {
    it("Transfer Token Amount", async function () {
      // Approve the token transfer
      const iwethamount = ethers.utils.parseUnits("0.00001", 18);
      const daiamount = ethers.utils.parseUnits("1", 18);

      let tx3 = await iweth.connect(deployer).transfer(swapaddress, iwethamount);
      await tx3.wait();

      let tx5 = await idai.connect(deployer).transfer(swapaddress, daiamount);
      await tx5.wait();
    });
  });

  describe('show balance', function () {
    it('show swap contract balance', async function () {
      const TransferWethbalance = await swap.getWethBalance();
      const transferWethbalance = ethers.utils.formatUnits(TransferWethbalance, 18);
      console.log("Transfer Weth Balance: ", transferWethbalance);

      // const TransferDaibalance = await swap.getBalance(idaiaddress);
      // const transferdaiBalance = ethers.utils.formatUnits(TransferDaibalance, 18);
      // console.log("Transfer Dai Balance: ", transferdaiBalance);
    })
  })

  describe("getAmountsOut", function () {
    it("getAmountsOut", async function () {
      const iwethamount = ethers.utils.parseUnits("0.00001", 18);
      const daiamount = ethers.utils.parseUnits("1", 18);
      
      let tx9 = await swap.getAmountsOut(iwethamount, uniRouterAddress, iwethaddress,idaiaddress);
      let tx10 = await swap.getAmountsOut(iwethamount, sushiRouterAddress,iwethaddress,idaiaddress);

      let tx11 = await swap.getAmountsOut(daiamount, uniRouterAddress, idaiaddress,iwethaddress);
      let tx12 = await swap.getAmountsOut(daiamount, sushiRouterAddress, idaiaddress,iwethaddress);

      console.log("iweth to dai on uniswap: ", ethers.utils.formatUnits(tx9, 18));
      console.log("iweth to dai on sushi: ", ethers.utils.formatUnits(tx10, 18));

      console.log("dai to iweth on uniswap: ", ethers.utils.formatUnits(tx11, 18));
      console.log("dai to iweth on sushi: ", ethers.utils.formatUnits(tx12, 18));
    });
  });

  describe('makeArbitage', function () {
    it('makeArbitage', async function () {
      let tx6 = await swap.makeArbitrage(0, iwethaddress,idaiaddress);
      await tx6.wait();      

      let receipt6 = await tx6.wait();
      let gasUsed6 = receipt6.gasUsed;
      console.log("Gas used for makeArbitage: ", gasUsed6.toString());
    });
  });

  describe("withdraw", function () {
    it("withdraw", async function () {
      let tx7 = await swap.connect(deployer).withdraw();
      await tx7.wait();

      const iwethbalance = await iweth.balanceOf(deployer.address);
      expect(await iweth.balanceOf(deployer.address)).to.equal(iwethbalance);
      console.log("MetaMask weth Balance: ", ethers.utils.formatUnits(iwethbalance, 18));
    });
  });
});