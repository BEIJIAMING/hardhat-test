// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

contract Market {
    address payable owner;

    IPoolAddressesProvider private immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;
    address private immutable poolAddress = 0xE7EC1B0015eb2ADEedb1B7f9F1Ce82F9DAD6dF08; // Pool-Proxy-Aave
    
    constructor(address _addressProvider) {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(_addressProvider);
        POOL = IPool(ADDRESSES_PROVIDER.getPool());
        owner = payable(msg.sender);
    }
    
    // depositor
    function supplyLiquidity(address _tokenAddress, uint256 _amount) external {
        address asset = _tokenAddress;
        uint256 amount = _amount;
        address onBehalfOf = address(this); 
        uint16 referralCode = 0;

        // IERC20token = IERC20(_tokenAddress);
        // uint256 allowance = token.allowance(address(this), poolAddress);
        // require(allowance>=_amount, '"Check the token allowance"');

        POOL.supply(asset, amount, onBehalfOf, referralCode);
    }

    function withdrawLiquidity(address _tokenAddress, uint256 _amount) external onlyOwner returns (uint256) {
        address asset = _tokenAddress;
        uint256 amount = _amount;
        address to = address(this);

        return POOL.withdraw(asset, amount, to);
    }

    // Borrower
    function borrowFromLiquidity(address _tokenAddress, uint256 _amount, uint8 _interestRateMode) external {
        address asset = _tokenAddress;
        uint256 amount = _amount;
        uint256 interestRateMode = _interestRateMode; // 1 for Stable, 2 for Variable
        uint16 referralCode = 0;
        address onBehalfOf = address(this);

        POOL.borrow(asset, amount, interestRateMode, referralCode, onBehalfOf);
    }

    function repaytoLiquidity(address _tokenAddress, uint256 _amount, uint8 _interestRateMode) external {
        address asset = _tokenAddress;
        uint256 amount = _amount;
        uint256 interestRateMode = _interestRateMode; // 1 for Stable, 2 for Variable
        uint16 referralCode = 0;
        address onBehalfOf = address(this);

        POOL.borrow(asset, amount, interestRateMode, referralCode, onBehalfOf);
    }

    // Returns the user account data across all the reserves
    function getUserAccountData(address _userAddress)
        external
        view
        returns (
            // The total collateral of the user in the base currency used by the price feed
            uint256 totalCollateralBase, 
            // The total debt of the user in the base currency used by the price feed
            uint256 totalDebtBase,
            // The borrowing power left of the user in the base currency used by the price feed
            uint256 availableBorrowsBase,
            // The liquidation threshold of the user
            uint256 currentLiquidationThreshold,
            // The loan to value of The user
            uint256 ltv,
            // The current health factor of the user
            uint256 healthFactor
        )
    {
        return POOL.getUserAccountData(_userAddress);
    }

    function approvetoken(address _tokenAddress, uint256 _amount) external returns (bool) {
        IERC20 token = IERC20(_tokenAddress);

        return token.approve(poolAddress, _amount);

        
    }

    function allowancetoken(address _tokenAddress) external view returns (uint256){
        IERC20 token = IERC20(_tokenAddress);
        return token.allowance(address(this), poolAddress);
    }

    function getBalancetoken(address _tokenAddress) external view returns (uint256) {
        IERC20 token = IERC20(_tokenAddress);
        return token.balanceOf(address(this));
    }

    // withdraw those funds back from the contract to wallet
    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can call this function"
        );
        _;
    }

    receive() external payable {}
}