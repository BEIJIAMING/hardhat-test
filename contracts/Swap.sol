// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IUniswapV2Router02} from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';


enum Exchange {
    UNI,
    SUSHI,
    NONE
}


contract Swap {
    address payable owner;
    address public immutable wethAddress = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    IERC20 public weth;

    address private immutable  uniRouterAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private immutable  sushiRouterAddress = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;


    constructor() {
        owner = payable(msg.sender);
        weth = IERC20(wethAddress);
    }

    function makeArbitrage (uint8 router,address sell_token, address buy_token) public{
        uint256 amountIn = IERC20(sell_token).balanceOf(address(this));
        // Exchange result= checkArbitage(amountIn, sell_token, buy_token);
        if(router==0){
            // sell dai on uni
            // sell token-dai
            // buy token-eth
            uint256 uniOut = swap(amountIn, uniRouterAddress,sell_token,buy_token);
            // buy dai on sushi
            // sell token-eth
            // buy token-dai
            swap(uniOut, sushiRouterAddress,buy_token,sell_token);
        } else if (router==1){
            // sell on sushi
            uint256 suhiOut = swap(amountIn, sushiRouterAddress,sell_token,buy_token);
            // buy dai on uni
            swap(suhiOut, uniRouterAddress,buy_token,sell_token);
        } 
    }

    // Swap WETH to DAI 
    // buy dai 
    // 沿着路径确定的路线，用确切数量的输入代币交换尽可能多的输出代币。
    // 路径:
    // - 第一个元素是输入代币，
    // - 最后一个元素是输出代币
    function swap(uint256 _amountIn,address _routerAddress,address sell_token,address buy_token) public returns(uint256) {
            // approve sell_token from this address to routerAddress
            IERC20(sell_token).approve(_routerAddress, _amountIn); 

            // set AmountOutMin 95%
            uint256 amountOutMin = getAmountsOut(_amountIn,_routerAddress,sell_token, buy_token);
            
            address[] memory path = new address[](2);
            path[0]=sell_token; // WETH
            path[1]=buy_token; // DAI

            uint256 amountOut = IUniswapV2Router02(_routerAddress).swapExactTokensForTokens(
                _amountIn,
                amountOutMin,
                path,
                address(this),
                block.timestamp)[1];
                // amounts[0] = WETH amount, 
                // amounts[1] = DAI amount
            return amountOut;
    }

    // 获取dai的数量
    function getAmountsOut(uint256 _amountIn, address _routerAddress, address sell_token, address buy_token) public view returns (uint256){
        address[] memory pairs = new address[](2);
        pairs[0] = sell_token; // sell
        pairs[1] = buy_token; // buy
        uint256 price = IUniswapV2Router02(_routerAddress).getAmountsOut(_amountIn,pairs)[1];
        return price;
    }

    // uniswap & sushiswap have 0.3% fee for every exchange
    // so gain made must be greater than 2 * 0.3% * arbitrage_amount

    function getArbitageProfit(uint256 _amountIn, address sell_token, address buy_token) public view returns (uint256) {
        uint256 uniPrice = getAmountsOut(
            _amountIn,
            uniRouterAddress,
            sell_token,
            buy_token  
            );
        uint256 sushiPrice = getAmountsOut(
                _amountIn,
                sushiRouterAddress,
                sell_token,
                buy_token
            );

        // uint256 TX_FEE=3/1000;

        if(uniPrice>sushiPrice){
            uint256 effUniPrice = uniPrice - ( (uniPrice * 3)/1000);
            uint256 effsushiPrice = sushiPrice + ( (sushiPrice * 3)/1000);
            uint256 spread = effUniPrice - effsushiPrice;
            if (spread>0) {
                return(spread);  // sell on uni, buy on sushi
        }  
        
        if(sushiPrice>uniPrice){
            uint256 effsushiPrice = sushiPrice - ( (sushiPrice * 3)/1000);
            uint256 effUniPrice = uniPrice + ( (uniPrice * 3)/1000);
            uint256 spread = effsushiPrice - effUniPrice;
            if (spread>0) {
                return(spread); // sell on sushi, buy on uni
            } 
        } 

        }
    } // return profit

    function checkArbitage(uint256 _amountIn, address sell_token, address buy_token) public view returns (Exchange) {
        uint256 uniPrice = getAmountsOut(
            _amountIn,
            uniRouterAddress,
            sell_token,
            buy_token  
        );
        uint256 sushiPrice = getAmountsOut(
             _amountIn,
            sushiRouterAddress,
            sell_token,
            buy_token
        );

        // uint256 TX_FEE=3/1000;

        if(uniPrice>sushiPrice){
            uint256 effUniPrice = uniPrice - ( (uniPrice * 3)/1000);
            uint256 effsushiPrice = sushiPrice + ( (sushiPrice * 3)/1000);
            uint256 spread = effUniPrice - effsushiPrice;
            if (spread>0) {
                return(Exchange.UNI);  // sell on uni, buy on sushi
            } 

        if(sushiPrice>uniPrice){
            uint256 effsushiPrice = sushiPrice - ( (sushiPrice * 3)/1000);
            uint256 effUniPrice = uniPrice + ( (uniPrice * 3)/1000);
            uint256 spread = effsushiPrice - effUniPrice;
            if (spread>0) {
                return(Exchange.SUSHI); // sell on sushi, buy on uni
            } 
        }

        }
    }

    // 
    function getWethBalance() public view returns(uint256){
        return weth.balanceOf(address(this));
    }

    function getBalance(address _tokenaddress) public view returns(uint256){
        return IERC20(_tokenaddress).balanceOf(address(this));
    }

    function approve(address _tokenaddress,address _routerAddress, uint256 _tokenamount) public {
        IERC20(_tokenaddress).approve(_routerAddress, _tokenamount); 
    }

    function withdraw() external onlyOwner{
        weth.transfer(msg.sender,weth.balanceOf(address(this)));
    } 

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }
}