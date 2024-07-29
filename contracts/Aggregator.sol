// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

//import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Token.sol";
import "./AMM.sol";

contract Aggregator is ReentrancyGuard {
	string public name;
	Token public token1;
	Token public token2;
	AMM public amm1;
	AMM public amm2;
	address public owner;

	uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K;

    mapping(address => uint256) public userDeposits;
    uint256 public totalValueDeposited;

    event ExecuteSwap(
    	address user,
    	address tokenIn,
    	uint256 tokenInAmount,
    	address tokenOut,
    	uint256 tokenOutAmount,
    	uint256 token1Balance,
    	uint256 token2Balance,
    	uint256 timestamp
    );

	constructor(
		string memory _name,
		Token _token1,
		Token _token2,
		AMM _amm1,
		AMM _amm2
	) {
		name = _name;
		token1 = _token1;
		token2 = _token2;
		amm1 = _amm1;
		amm2 = _amm2;
		owner = msg.sender;
	}

	////////////////////////////////////////////////////////////////////////////////
    // ADDING LIQUIDITY
    ////////////////////////////////////////////////////////////////////////////////

   	function _recordDeposit(address _user, uint256 _token1Amount, uint256 _token2Amount) internal {
    	uint256 totalDepositAmount = _token1Amount + _token2Amount;

    	userDeposits[_user] += totalDepositAmount;
    	totalValueDeposited += totalDepositAmount;
    }

    function _disperseLiquidity(uint256 _token1Amount, uint256 _token2Amount) internal {
    	uint256 dispersedToken1Amount = _token1Amount / 2;
    	uint256 dispersedToken2Amount = _token2Amount / 2;

    	token1.approve(address(amm1), dispersedToken1Amount);
    	token2.approve(address(amm1), dispersedToken2Amount);
    	token1.approve(address(amm2), dispersedToken1Amount);
    	token2.approve(address(amm2), dispersedToken2Amount);

    	amm1.addLiquidity(dispersedToken1Amount, dispersedToken2Amount);
    	amm2.addLiquidity(dispersedToken1Amount, dispersedToken2Amount);
    }

    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount)
    	external
    	nonReentrant
    {
        // Deposit tokens
        require(
            token1.transferFrom(msg.sender, address(this), _token1Amount),
            "failed to transfer token 1"
        );
        require(
            token2.transferFrom(msg.sender, address(this), _token2Amount),
            "failed to transfer token 2"
        );

        // Record users deposit
        _recordDeposit(msg.sender, _token1Amount, _token2Amount);

        // Disperse liquidity to amms
        _disperseLiquidity(_token1Amount, _token2Amount);
    }

    ////////////////////////////////////////////////////////////////////////////////
    // CALCULATING TOKEN DEPOSITS
    ////////////////////////////////////////////////////////////////////////////////

    function calculateToken1Deposit(uint256 _token2Amount)
    	public
    	view
    	returns (uint256 token1Deposit)
    {
    	uint256 amm1Token1Deposit = amm1.calculateToken1Deposit((_token2Amount / 2));
    	uint256 amm2Token1Deposit = amm2.calculateToken1Deposit((_token2Amount / 2));

    	token1Deposit = amm1Token1Deposit + amm2Token1Deposit;
    }

    function calculateToken2Deposit(uint256 _token1Amount)
    	public
    	view
    	returns (uint256 token2Deposit)
    {
    	uint256 amm1Token2Deposit = amm1.calculateToken2Deposit((_token1Amount / 2));
    	uint256 amm2Token2Deposit = amm2.calculateToken2Deposit((_token1Amount / 2));

    	token2Deposit = amm1Token2Deposit + amm2Token2Deposit;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // REMOVING LIQUIDITY
    ////////////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////////////
    // SWAPPING
    ////////////////////////////////////////////////////////////////////////////////

	// Determines best token2 output with token1 input
	function getBestToken1Price(uint256 _token1Amount)
		public
		view
		returns (uint256, address)
	{
		uint256 token2OutputAmm1 = amm1.calculateToken1Swap(_token1Amount);
		uint256 token2OutputAmm2 = amm2.calculateToken1Swap(_token1Amount);

		if (token2OutputAmm1 > token2OutputAmm2) {
			return(token2OutputAmm1, address(amm1));
		} else {
			return(token2OutputAmm2, address(amm2));
		}
	}

	// Determines best token1 output with token2 input
	function getBestToken2Price(uint256 _token2Amount)
		public
		view
		returns (uint256, address)
	{
		uint256 token1OutputAmm1 = amm1.calculateToken2Swap(_token2Amount);
		uint256 token1OutputAmm2 = amm2.calculateToken2Swap(_token2Amount);

		if (token1OutputAmm1 > token1OutputAmm2) {
			return(token1OutputAmm1, address(amm1));
		} else {
			return(token1OutputAmm2, address(amm2));
		}
	}

	// Swaps token1 for best price --- receives token2
	function executeSwapToken1(uint256 _token1Amount)
		external
		nonReentrant
		returns (uint256, uint256)
	{
		(uint256 expectedToken2Output, address amm) = getBestToken1Price(_token1Amount);
		uint256 token2Output;

		token1.approve(address(this), _token1Amount);
		token1.transferFrom(msg.sender, address(this), _token1Amount);

		if (amm == address(amm1)) {
			token1.approve(address(amm1), _token1Amount);
			token2Output = amm1.swapToken1(_token1Amount);
			token2.transfer(msg.sender, token2Output);
		} else {
			token1.approve(address(amm2), _token1Amount);
			token2Output = amm2.swapToken1(_token1Amount);
			token2.transfer(msg.sender, token2Output);
		}

		emit ExecuteSwap(
	    	msg.sender,
	    	address(token1),
	    	_token1Amount,
	    	address(token2),
	    	expectedToken2Output,
	    	token1Balance,
	    	token2Balance,
	    	block.timestamp
		);

		return (expectedToken2Output, token2Output);
	}

	// Swaps token1 for best price --- receives token2
	function executeSwapToken2(uint256 _token2Amount)
		external
		nonReentrant
		returns (uint256, uint256)
	{
		(uint256 expectedToken1Output, address amm) = getBestToken2Price(_token2Amount);
		uint256 token1Output;

		token2.approve(address(this), _token2Amount);
		token2.transferFrom(msg.sender, address(this), _token2Amount);

		if (amm == address(amm1)) {
			token2.approve(address(amm1), _token2Amount);
			token1Output = amm1.swapToken2(_token2Amount);
			token1.transfer(msg.sender, token1Output);
		} else {
			token2.approve(address(amm2), _token2Amount);
			token1Output = amm2.swapToken2(_token2Amount);
			token1.transfer(msg.sender, token1Output);
		}

		emit ExecuteSwap(
	    	msg.sender,
	    	address(token2),
	    	_token2Amount,
	    	address(token1),
	    	expectedToken1Output,
	    	token1Balance,
	    	token2Balance,
	    	block.timestamp
		);

    	return (expectedToken1Output, token1Output);
	}
}
