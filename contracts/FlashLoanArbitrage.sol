// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol"; // interface
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {IUniswapV2Router02} from '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Arbitrage
// WETH 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6
// Link 0x326C977E6efc84E512bB9C30f76E30c160eD06FB

// AAve
// link  0xe9c4393a23246293a8D31BF7ab68c17d4CF90A29
// alink 0x493DC51c35F7ddD891262b8733C63eABaf14786f
contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase, ReentrancyGuard {
    using SafeMath for uint256;
    address payable owner;
    // address private immutable poolAddress = 0x7b5C526B7F8dfdff278b4a3e045083FBA4028790; // Goerli Pool-Proxy-Aave  
    address private immutable poolAddress = 0xE7EC1B0015eb2ADEedb1B7f9F1Ce82F9DAD6dF08;// Sepolia Pool-Proxy-Aave 
    address private immutable uniRouterAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private immutable sushiRouterAddress = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address private immutable  wethAddress = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    IERC20 public weth;

    enum Exchange {
        UNI,
        SUSHI,
        NONE
    }

    constructor(address _addressProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {
        owner = payable(msg.sender);
        weth = IERC20(wethAddress);
    }

    //--------------------------------------------------------------------
    // ARBITRAGE FUNCTIONS/LOGIC

    function makeArbitrage (address sell_token, address buy_token) public{
        uint256 amountIn = IERC20(sell_token).balanceOf(address(this));
        Exchange result= checkArbitage(amountIn, sell_token, buy_token);
        if(result==Exchange.UNI){
            // sell dai on uni
            // sell token-dai
            // buy token-eth
            uint256 uniOut = swap(amountIn, uniRouterAddress, sell_token, buy_token);
            // buy dai on sushi
            // sell token-eth
            // buy token-dai
            swap(uniOut, sushiRouterAddress, buy_token, sell_token);
            
        } else if (result==Exchange.SUSHI){
            // sell on sushi
            uint256 suhiOut = swap(amountIn, sushiRouterAddress, sell_token, buy_token);
            // buy dai on uni
            swap(suhiOut, uniRouterAddress, buy_token, sell_token);
        } 
    }

    function swap(uint256 _amountIn,address _routerAddress,address sell_token,address buy_token) internal returns(uint256) {
            // approve sell_token from this address to routerAddress
            IERC20(sell_token).approve(_routerAddress, _amountIn); 

            // set AmountOutMin 95%
            uint256 amountOutMin = (getAmountsOut(_amountIn,_routerAddress,sell_token, buy_token)*95)/100;
            
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

    // 获取buy token的数量
    function getAmountsOut(uint256 _amountIn, address _routerAddress, address sell_token, address buy_token) public view returns (uint256){
        address[] memory pairs = new address[](2);
        pairs[0] = sell_token; // sell
        pairs[1] = buy_token; // buy
        uint256 amountOut = IUniswapV2Router02(_routerAddress).getAmountsOut(_amountIn,pairs)[1];
        return amountOut;
    }

    // 查看情况
    function checkArbitage(uint256 _amountIn, address sell_token, address buy_token) public view returns (Exchange) {
        uint256 uniswapPrice = getAmountsOut(_amountIn,uniRouterAddress,sell_token,buy_token);
        uint256 sushiswapPrice = getAmountsOut(_amountIn,sushiRouterAddress,sell_token,buy_token);

        // we try to sell ETH with higher price and buy it back with low price to make profit
        if (uniswapPrice > sushiswapPrice) {
            require(
                _checkIfArbitrageIsProfitable(
                    _amountIn,
                    uniswapPrice,
                    sushiswapPrice
                ),
                "Arbitrage not profitable"
            );
            return Exchange.UNI;
        } else if (uniswapPrice < sushiswapPrice) {
            require(
                _checkIfArbitrageIsProfitable(
                    _amountIn,
                    sushiswapPrice,
                    uniswapPrice
                ),
                "Arbitrage not profitable"
            );
            return Exchange.SUSHI;
        } else {
            return Exchange.NONE;
        }
    }

    // function _checkIfArbitrageIsProfitable(uint256 higherPrice, uint256 lowerPrice) internal pure returns (bool) {
    function _checkIfArbitrageIsProfitable(uint256 _amountIn,uint256 higherPrice, uint256 lowerPrice) internal pure returns (bool) {
        // uniswap & sushiswap have 0.3% fee for every exchange
        // so gain made must be greater than 2 * 0.3% * arbitrage_amount

        // difference in ETH
        uint256 difference = ((higherPrice - lowerPrice) * 10**18) / higherPrice;

        uint256 payed_fee = (2 * (_amountIn * 3)) / 1000;

        // uint256 effHigherPrice = higherPrice - ( (higherPrice * 3)/1000);
        // uint256 effLowerPrice = lowerPrice + ( (lowerPrice * 3)/1000);
        // uint256 spread = effHigherPrice - effLowerPrice;
        // if (spread > 0) {
        if (difference > payed_fee) {
            return true;
        } else {
            return false;
        }
    }
    
    //--------------------------------------------------------------------
    // FLASHLOAN FUNCTIONS

    function requestFlashLoan(address _token, uint256 _amount) external nonReentrant{
        address receiverAddress = address(this);
        address asset = _token;
        uint256 amount = _amount;
        bytes memory params = "";
        uint16 referralCode = 0;

        require(_amount > 0, "Must borrow at least one token");

        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }
    
    
    //This function is called after your contract has received the flash loaned amount
    function  executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params)  external override returns (bool) {
        
        //Logic goes here
        
        uint256 totalAmount = amount + premium;
        IERC20(asset).approve(address(POOL), totalAmount);

        return true;
    }

    //--------------------------------------------------------------------
    // Supply FUNCTIONS
    // supply
    function supplyLiquidity(address _tokenAddress, uint256 _amount) external {
        address asset = _tokenAddress;
        uint256 amount = _amount;
        address onBehalfOf = address(this); 
        uint16 referralCode = 0;

        IERC20 token = IERC20(_tokenAddress);
        uint256 allowance = token.allowance(address(this), poolAddress);
        require(allowance>=_amount, '"Check the token allowance"');

        POOL.supply(asset, amount, onBehalfOf, referralCode);
    }

    // withdraw
    function withdrawLiquidity(address _tokenAddress, uint256 _amount) external onlyOwner returns (uint256) {
        address asset = _tokenAddress;
        uint256 amount = _amount;
        address to = address(this);

        return POOL.withdraw(asset, amount, to);
    }

    //--------------------------------------------------------------------
    // ERC20
    // approve this address→pool address
    function approvePool(address _tokenAddress, uint256 _amount) external returns (bool) {
        IERC20 token = IERC20(_tokenAddress);
        return token.approve(poolAddress, _amount);
    }
    // allowance this address→pool address
    function allowancePool(address _tokenAddress) external view returns (uint256){
        IERC20 token = IERC20(_tokenAddress);
        return token.allowance(address(this), poolAddress);
    }

    // 余额
    function getBalance(address _tokenaddress) public view returns(uint256){
        return IERC20(_tokenaddress).balanceOf(address(this));
    }

    // Metamask余额
    function getBalanceMetaMask(address _tokenaddress) public view returns(uint256){
        return IERC20(_tokenaddress).balanceOf(msg.sender);
    }

    // 存
    function deposit(address _tokenaddress, uint256 amount) public onlyOwner {
        require(amount > 0, "Deposit amount must be greater than 0");
        IERC20(_tokenaddress).transferFrom(msg.sender, address(this), amount);
    }

    // 取
    function withdraw(address _tokenaddress) public onlyOwner{
        IERC20(_tokenaddress).transfer(msg.sender,IERC20(_tokenaddress).balanceOf(address(this)));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    receive() external payable {}
}

