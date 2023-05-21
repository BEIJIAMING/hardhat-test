const { expect } = require("chai");
const { ethers } = require("hardhat");

// npx hardhat test test/Market.js --network sepolia

describe("Market", function () {
    let market, depositor, link, aToken;
    let marketaddress, linkaddress, atokenaddress;

    beforeEach(async function () {
        marketaddress = "0x2760A8bd7F8f9136AC536e857417315C93382142";
        linkaddress = "0x8a0E31de20651fe58A369fD6f76c21A8FF7f8d42";
        atokenaddress = "0xD21A6990E47a07574dD6a876f6B5557c990d5867";

        //Setup accounts
        const [account] = await ethers.getSigners();
        depositor = account;

        // token 
        link = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", linkaddress);

        // aave atoken
        aToken = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", atokenaddress);

        //Load contract
        market = await ethers.getContractAt("Market", marketaddress);

    });

    describe("Show balance", function () {
        it("Should return the right balance", async function () {
            const Linkbalance = await link.balanceOf(depositor.address);
            expect(await link.balanceOf(depositor.address)).to.equal(Linkbalance);

            const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
            console.log("MetaMask Balance: ", linkbalance);
        });
    });
    describe("ApproveToken", function () {
        it("Approve Token Amount", async function () {
            const amount = ethers.utils.parseUnits("1", 18);
            let tx1 = await market.approvetoken(linkaddress, amount);
            await tx1.wait();

            const Allowance = await market.allowancetoken(linkaddress);
            const allowance = ethers.utils.formatUnits(Allowance, 18);
            console.log("MetaMask Balance: ", allowance);
        });
    });
    describe("TransferToken", function () {
        it("Transfer Token Amount", async function () {
            // Approve the token transfer
            const amount = ethers.utils.parseUnits("1", 18);
            let tx2 = await link.connect(depositor).approve(marketaddress, amount);
            await tx2.wait();

            let tx3 = await link.connect(depositor).transfer(marketaddress, amount);
            await tx3.wait();

            const TransferLinkbalance = await link.balanceOf(marketaddress);
            const transferlinkbalance = ethers.utils.formatUnits(TransferLinkbalance, 18);
            console.log('market link balance', transferlinkbalance);
        });
    });
    describe("SupplyLiquidity", function () {  
        it("supplyLiquidity", async function () {
            const amount = ethers.utils.parseUnits("1", 18);
            let tx5 = await market.connect(depositor).approvetoken(linkaddress, amount);
            await tx5.wait();

            let tx4 = await market.connect(depositor).supplyLiquidity(linkaddress, amount);
            await tx4.wait();

            const Atokenbalnace = await aToken.balanceOf(marketaddress)
            const atokenbalance = ethers.utils.formatUnits(Atokenbalnace, 18);
            console.log('atoken balance', atokenbalance);
        });
    });

    describe("withdrawLiquidity", function () {
        it("withdrawLiquidity", async function () {
            const initbalanceatoken = await market.getBalancetoken(atokenaddress);
            await market.withdrawLiquidity(linkaddress, initbalanceatoken);
            // await tx5.wait();

            const NewBalanceaToken = await aToken.balanceOf(marketaddress);
            const newbalanceatoken = ethers.utils.formatUnits(NewBalanceaToken, 18);
            console.log('atoken balance', newbalanceatoken);
        });
    });
    describe("withdraw to MetaMask", function () {
        it("withdraw to MetaMask", async function () {
            const InitMetamaskBalance = await link.balanceOf(depositor.address);
            const initmetamaskbalance = ethers.utils.formatUnits(InitMetamaskBalance, 18);
            console.log('metamask balance', initmetamaskbalance);

            let tx6 = await market.connect(depositor).withdraw(linkaddress);
            await tx6.wait();
        });
    });
    describe("show money", function () {
        it("show money", async function () {
            const NewMetamaskBalance = await link.balanceOf(depositor.address);
            const newmetamaskbalance = ethers.utils.formatUnits(NewMetamaskBalance, 18);
            console.log('metamask balance', newmetamaskbalance);
        });
    });
});
