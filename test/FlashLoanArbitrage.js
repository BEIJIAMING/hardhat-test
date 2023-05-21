const { expect } = require('chai');
const { ethers } = require('hardhat');

//npx hardhat test test/FlashLoanArbitrage.js --network goerli

// FlashLoanArbitrage contract deployed:  0x03C6836301cB29552503984e3420C97BDeF901a2 goerli
// FlashLoanArbitrage contract deployed:  0x212eb07Ac7Bf70f1E5be999c07547DEB2a3545C9 sepolia

describe("FlashLoanArbitrage", () => {
    let link, alink, linkaddress, alinkaddress;
    let flashloanarbitrage
    let deployer, accounts
    let iweth, ilink, amount

    beforeEach(async () => {
        flashloanarbitrageaddress = "0x03C6836301cB29552503984e3420C97BDeF901a2"; // bei goerli
        // flashloanarbitrageaddress = "0x0B99ff1A7ec96cC46E6c26F0F2828a647447050E"; // chao goerli
        // flashloanarbitrageaddress = "0x2cf2fa3343eeFA1e8b8A346B64Ae222dC5ddDD0a"; // sepolia

        //Aave
        linkaddress = "0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29"; // goerli link
        alinkaddress = "0x493DC51c35F7ddD891262b8733C63eABaf14786f"; // goerli alink

        // linkaddress = "0x8a0E31de20651fe58A369fD6f76c21A8FF7f8d42"; // sepolia link
        // alinkaddress = "0xD21A6990E47a07574dD6a876f6B5557c990d5867";   // sepolia alink

        // Router
        uniRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        sushiRouterAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

        // Arbitrage
        iwethaddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"; //iweth goerli
        ilinkaddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"; //ilink goerli

        // Setup accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]

        link = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", linkaddress);
        alink = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", alinkaddress);
        iweth = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", iwethaddress);
        ilink = await ethers.getContractAt("@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol:IERC20", ilinkaddress);

        // Load contract 
        flashloanarbitrage = await ethers.getContractAt('FlashLoanArbitrage', flashloanarbitrageaddress)

        //amount
        amount = ethers.utils.parseUnits("1", 18)
    })
    
    describe("Flash Loan", function () {
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
                // const amount = ethers.utils.parseUnits("1", 18);
                let tx2 = await link.connect(deployer).approve(flashloanarbitrageaddress, amount);
                let receipt2 = await tx2.wait();
                let gasUsed2 = receipt2.gasUsed;
                console.log("Gas used for approve: ", gasUsed2.toString());

                let tx3 = await link.connect(deployer).transfer(flashloanarbitrageaddress, amount);
                let receipt3 = await tx3.wait();
                let gasUsed3 = receipt3.gasUsed;
                console.log("Gas used for transfer: ", gasUsed3.toString());

                const TransferLinkbalance = await link.balanceOf(flashloanarbitrageaddress);
                const transferlinkbalance = ethers.utils.formatUnits(TransferLinkbalance, 18);
                console.log('After transfer 1 link, flashloanarbitrage contract link balance', transferlinkbalance);
            });
        });

        describe("requestFlashLoan", () => {
            it("Should request a flash loan", async () => {
                // const amount = ethers.utils.parseUnits("1", 18);
                let tx1 = await flashloanarbitrage.requestFlashLoan(linkaddress, amount);
                let recepit = await tx1.wait();
                let gasUsed = recepit.gasUsed;
                console.log("Gas used for requestFlashLoan: ", gasUsed.toString());

                const Linkbalance = await link.balanceOf(flashloanarbitrageaddress);
                const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
                console.log("After requestflashLoan, Flash contract link Balance: ", linkbalance);
            })
        })
        describe("Withdraw", () => {
            it("Should withdraw the flash loan", async () => {
                let tx4 = await flashloanarbitrage.withdraw(linkaddress);
                let recepit = await tx4.wait();
                let gasUsed = recepit.gasUsed;
                console.log("Gas used for withdraw: ", gasUsed.toString());

                const Linkbalance = await link.balanceOf(deployer.address);
                const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
                console.log("After withdraw MetaMask Balance: ", linkbalance);
            })
        })
    })


    // describe("flashloanarbitrage", function () {
    //     describe("Swap", function () {
    //         describe("Show iweth balance", function () {
    //             it("Should return the right balance", async function () {
    //                 const iwethbalance = await iweth.balanceOf(deployer.address);
    //                 expect(await iweth.balanceOf(deployer.address)).to.equal(iwethbalance);
    //                 console.log("MetaMask weth Balance: ", ethers.utils.formatUnits(iwethbalance, 18));
    //             });
    //         });

    //         describe("Approve iweth Token", function () { 
    //             it("Approve Token Amount", async function () {
    //                 const iwethamount = ethers.utils.parseUnits("0.00001", 18);
                    
    //                 let tx2 = await iweth.connect(deployer).approve(flashloanarbitrageaddress, iwethamount);
    //                 await tx2.wait();
    //             });
    //         });
    //         describe("Approve ilink Token", function () { 
    //             it("Approve Token Amount", async function () {
    //                 const ilinkamount = ethers.utils.parseUnits("1", 18);

    //                 let tx4 = await ilink.connect(deployer).approve(flashloanarbitrageaddress, ilinkamount);
    //                 await tx4.wait();
    //             });
    //         });

    //         describe("TransferToken", function () {
    //             it("Transfer Token Amount", async function () {
    //                 // Approve the token transfer
    //                 const iwethamount = ethers.utils.parseUnits("0.00001", 18);
    //                 const ilinkamount = ethers.utils.parseUnits("1", 18);

    //                 let tx3 = await iweth.connect(deployer).transfer(flashloanarbitrageaddress, iwethamount);
    //                 await tx3.wait();

    //                 let tx5 = await ilink.connect(deployer).transfer(flashloanarbitrageaddress, ilinkamount);
    //                 await tx5.wait();
    //             });
    //         });

    //         describe('show balance', function () {
    //             it('show flashloanarbitrage contract balance', async function () {
    //                 const TransferWethbalance = await flashloanarbitrage.getBalance(iwethaddress);
    //                 const transferWethbalance = ethers.utils.formatUnits(TransferWethbalance, 18);
    //                 console.log("Transfer Weth Balance: ", transferWethbalance);
    //             })
    //         })

    //         describe("getAmountsOut", function () {
    //             it("getAmountsOut", async function () {
    //                 const iwethamount = ethers.utils.parseUnits("0.00001", 18);
    //                 const ilinkamount = ethers.utils.parseUnits("1", 18);
                    
    //                 let tx9 = await flashloanarbitrage.getAmountsOut(iwethamount, uniRouterAddress, iwethaddress, ilinkaddress);
    //                 let tx10 = await flashloanarbitrage.getAmountsOut(iwethamount, sushiRouterAddress,iwethaddress, ilinkaddress);

    //                 let tx11 = await flashloanarbitrage.getAmountsOut(ilinkamount, uniRouterAddress, ilinkaddress, iwethaddress);
    //                 let tx12 = await flashloanarbitrage.getAmountsOut(ilinkamount, sushiRouterAddress, ilinkaddress, iwethaddress);

    //                 console.log("iweth to ilink on uniswap: ", ethers.utils.formatUnits(tx9, 18));
    //                 console.log("iweth to ilink on sushi: ", ethers.utils.formatUnits(tx10, 18));

    //                 console.log("ilink to iweth on uniswap: ", ethers.utils.formatUnits(tx11, 18));
    //                 console.log("ilink to iweth on sushi: ", ethers.utils.formatUnits(tx12, 18));
    //             })
    //         })

    //         describe('makeArbitage', function () {
    //             it('makeArbitage', async function () {
    //                 let tx6 = await flashloanarbitrage.makeArbitrage(iwethaddress,ilinkaddress);
    //                 let receipt = await tx6.wait(); 
                    
    //                 //show gas used
    //                 let gasUsed = receipt.gasUsed;
    //                 console.log("Gas used for makeArbitrage: ", gasUsed.toString());
    //             });
    //         });

    //         describe("withdraw", function () {
    //             it("withdraw", async function () {
    //                 let tx7 = await flashloanarbitrage.connect(deployer).withdraw(iwethaddress);
    //                 await tx7.wait();

    //                 const iwethbalance = await iweth.balanceOf(deployer.address);
    //                 expect(await iweth.balanceOf(deployer.address)).to.equal(iwethbalance);
    //                 console.log("MetaMask weth Balance: ", ethers.utils.formatUnits(iwethbalance, 18));
    //             });
    //         });
    //     });
    // })


    // describe("Market", function () {
    //     describe("Show balance", function () {
    //         it("Should return the right balance", async function () {
    //             const Linkbalance = await link.balanceOf(deployer.address);
    //             expect(await link.balanceOf(deployer.address)).to.equal(Linkbalance);

    //             const linkbalance = ethers.utils.formatUnits(Linkbalance, 18);
    //             console.log("MetaMask Balance: ", linkbalance);
    //         });
    //     });
    //     describe("ApproveToken", function () {
    //         it("Approve Token Amount", async function () {
    //             const amount = ethers.utils.parseUnits("1", 18);
    //             let tx1 = await flashloanarbitrage.approvePool(linkaddress, amount);
    //             await tx1.wait();

    //             const Allowance = await flashloanarbitrage.allowancePool(linkaddress);
    //             const allowance = ethers.utils.formatUnits(Allowance, 18);
    //             console.log("MetaMask Balance: ", allowance);
    //         });
    //     });
    //     describe("TransferToken", function () {
    //         it("Transfer Token Amount", async function () {
    //             // Approve the token transfer
    //             const amount = ethers.utils.parseUnits("1", 18);
    //             let tx2 = await link.connect(deployer).approve(flashloanarbitrageaddress, amount);
    //             await tx2.wait();

    //             let tx3 = await link.connect(deployer).transfer(flashloanarbitrageaddress, amount);
    //             await tx3.wait();

    //             const TransferLinkbalance = await link.balanceOf(flashloanarbitrageaddress);
    //             const transferlinkbalance = ethers.utils.formatUnits(TransferLinkbalance, 18);
    //             console.log('flashloanarbitrage contact link balance', transferlinkbalance);
    //         });
    //     });
    //     describe("SupplyLiquidity", function () {  
    //         it("supplyLiquidity", async function () {
    //             // const amount = ethers.utils.parseUnits("1", 18);
    //             flashloanarbitrage.connect(deployer).approvePool(linkaddress, amount);
    //             flashloanarbitrage.connect(deployer).allowancePool(linkaddress);
                

    //             let tx4 = await flashloanarbitrage.connect(deployer).supplyLiquidity(linkaddress, amount);
    //             let receipt4 = await tx4.wait();
    //             let gasUsed4 = receipt4.gasUsed;
    //             console.log("Gas used for supply: ", gasUsed4.toString());

    //             const Atokenbalnace = await alink.balanceOf(flashloanarbitrageaddress)
    //             const alinkbalance = ethers.utils.formatUnits(Atokenbalnace, 18);
    //             console.log('alink balance', alinkbalance);
    //         });
    //     });

    //     describe("withdrawLiquidity", function () {
    //         it("withdrawLiquidity", async function () {
    //             const initbalancealink = await flashloanarbitrage.getBalance(alinkaddress);
    //             let tx5 = await flashloanarbitrage.withdrawLiquidity(linkaddress, initbalancealink, {gasLimit: 1000000});
    //             let receipt5 = await tx5.wait();
    //             let gasUsed5 = receipt5.gasUsed;
    //             console.log("Gas used for withdraw: ", gasUsed5.toString());

    //             const NewBalancealink = await alink.balanceOf(flashloanarbitrageaddress);
    //             const newbalancealink = ethers.utils.formatUnits(NewBalancealink, 18);
    //             console.log('alink balance', newbalancealink);
    //         });
    //     });
    //     describe("withdraw to MetaMask", function () {
    //         it("withdraw to MetaMask", async function () {
    //             const InitMetamaskBalance = await link.balanceOf(deployer.address);
    //             const initmetamaskbalance = ethers.utils.formatUnits(InitMetamaskBalance, 18);
    //             console.log('metamask balance', initmetamaskbalance);

    //             let tx6 = await flashloanarbitrage.connect(deployer).withdraw(linkaddress);
    //             await tx6.wait();
    //         });
    //     });
    //     describe("show money", function () {
    //         it("show money", async function () {
    //             const NewMetamaskBalance = await link.balanceOf(deployer.address);
    //             const newmetamaskbalance = ethers.utils.formatUnits(NewMetamaskBalance, 18);
    //             console.log('metamask balance', newmetamaskbalance);
    //         })
    //     })
    // })
})

