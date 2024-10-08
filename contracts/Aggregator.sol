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

	uint256 public decimals = 18;

    event ExecuteSwap(
    	address user,
    	address tokenIn,
    	uint256 tokenInAmount,
    	address tokenOut,
    	uint256 tokenOutAmount,
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
    // DISTRIBUTE TOKENS TO USERS FOR TESTING
    ////////////////////////////////////////////////////////////////////////////////

	function distributeTokens() external nonReentrant {
		uint256 value = 10**decimals;
		require(token1.balanceOf(address(this)) > 1000 * value, "Contract does not have enough funds");
		require(token2.balanceOf(address(this)) > 1000 * value, "Contract does not have enough funds");
		require(token1.balanceOf(msg.sender) < 1000 * value, "User reached max balance for receiving tokens");
		require(token2.balanceOf(msg.sender) < 1000 * value, "User reached max balance for receiving tokens");

		token1.transfer(msg.sender, 100 * value);
		token2.transfer(msg.sender, 100 * value);
	}

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

		token1.transferFrom(msg.sender, address(this), _token1Amount);

		token1.approve(address(amm), _token1Amount);

		if (amm == address(amm1)) {
			token2Output = amm1.swapToken1(_token1Amount);
			token2.transfer(msg.sender, token2Output);
		} else {
			token2Output = amm2.swapToken1(_token1Amount);
			token2.transfer(msg.sender, token2Output);
		}

		emit ExecuteSwap(
	    	msg.sender,
	    	address(token1),
	    	_token1Amount,
	    	address(token2),
	    	token2Output,
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

		token2.transferFrom(msg.sender, address(this), _token2Amount);

		token2.approve(address(amm), _token2Amount);

		if (amm == address(amm1)) {
			token1Output = amm1.swapToken2(_token2Amount);
			token1.transfer(msg.sender, token1Output);
		} else {
			token1Output = amm2.swapToken2(_token2Amount);
			token1.transfer(msg.sender, token1Output);
		}

		emit ExecuteSwap(
	    	msg.sender,
	    	address(token2),
	    	_token2Amount,
	    	address(token1),
	    	token1Output,
	    	block.timestamp
		);

    	return (expectedToken1Output, token1Output);
	}
}
