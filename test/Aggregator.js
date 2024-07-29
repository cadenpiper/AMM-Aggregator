const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

describe('Aggregator', () => {
	let accounts,
			deployer,
			liquidityProvider,
			investor1

	let token1,
			token2,
			amm1,
			amm2,
			aggregator

	let transaction

	beforeEach(async () => {
		// Set up accounts
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		liquidityProvider = accounts[1]
		investor1 = accounts[2]

		// Deploy token contracts
		const Token = await ethers.getContractFactory('Token')
		token1 = await Token.deploy('token1', 'TKN1', '1000000')
		await token1.deployed()
		token2 = await Token.deploy('token2', 'TKN2', '1000000')
		await token2.deployed()

    // Deploy amm contracts
    const AMM = await ethers.getContractFactory('AMM')
    amm1 = await AMM.deploy('amm1', token1.address, token2.address)
    await amm1.deployed()
    amm2 = await AMM.deploy('amm2', token1.address, token2.address)
    await amm2.deployed()

    // Deploy aggregator contract
    const Aggregator = await ethers.getContractFactory('Aggregator')
    aggregator = await Aggregator.deploy(
    	'aggregator',
    	token1.address,
    	token2.address,
    	amm1.address,
    	amm2.address
    )
    await aggregator.deployed()

    // Transfer tokens to users
    // Liquidity provider
    transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(400000))
    await transaction.wait()
    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(400000))
    await transaction.wait()
    // Investor #1
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(400000))
    await transaction.wait()
    transaction = await token2.connect(deployer).transfer(investor1.address, tokens(400000))
    await transaction.wait()
	})

	describe('Deployment', () => {
		it('has correct name', async () => {
			expect(await aggregator.name()).to.equal('aggregator')
		})

		it('tracks token addresses', async () => {
			expect(await aggregator.token1()).to.equal(token1.address)
			expect(await aggregator.token2()).to.equal(token2.address)
		})

		it('tracks amm addresses', async () => {
			expect(await aggregator.amm1()).to.equal(amm1.address)
			expect(await aggregator.amm2()).to.equal(amm2.address)
		})
	})

	describe('Adding Liquidity', () => {
		let transaction

		beforeEach(async () => {
			// Liqudity provider approves tokens for aggregator
			transaction = await token1.connect(liquidityProvider).approve(aggregator.address, tokens(500))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(aggregator.address, tokens(500))
			await transaction.wait()

			// Investor1 approves tokens for aggregator
			transaction = await token1.connect(investor1).approve(aggregator.address, tokens(250))
			await transaction.wait()
			transaction = await token2.connect(investor1).approve(aggregator.address, tokens(250))
			await transaction.wait()
		})

		it('adds liquidity', async () => {
			// Check amm balances before adding liquidity
			const amm1Token1Before = await amm1.token1Balance()
			const amm1Token2Before = await amm1.token2Balance()
			const amm2Token1Before = await amm2.token1Balance()
			const amm2Token2Before = await amm2.token2Balance()
			expect(amm1Token1Before).to.equal(tokens(0))
			expect(amm1Token2Before).to.equal(tokens(0))
			expect(amm2Token1Before).to.equal(tokens(0))
			expect(amm2Token2Before).to.equal(tokens(0))

			transaction = await aggregator.connect(liquidityProvider).addLiquidity(tokens(500), tokens(500))
			await transaction.wait()
			transaction = await aggregator.connect(investor1).addLiquidity(tokens(250), tokens(250))
			await transaction.wait()

			// Check amm balances after adding liquidity
			const amm1Token1After = await amm1.token1Balance()
			const amm1Token2After = await amm1.token2Balance()
			const amm2Token1After = await amm2.token1Balance()
			const amm2Token2After = await amm2.token2Balance()
			expect(amm1Token1After).to.equal(tokens(375))
			expect(amm1Token2After).to.equal(tokens(375))
			expect(amm2Token1After).to.equal(tokens(375))
			expect(amm2Token2After).to.equal(tokens(375))
		})

		it('calculates token deposits', async () => {
			transaction = await aggregator.connect(liquidityProvider).addLiquidity(tokens(500), tokens(500))
			await transaction.wait()
			transaction = await aggregator.connect(investor1).addLiquidity(tokens(250), tokens(250))
			await transaction.wait()

			const token1Deposit = await aggregator.calculateToken1Deposit(tokens(50))
			expect(token1Deposit).to.equal(tokens(50))
			const token2Deposit = await aggregator.calculateToken2Deposit(tokens(100))
			expect(token2Deposit).to.equal(tokens(100))
		})

		it('records user deposits', async () => {
			transaction = await aggregator.connect(liquidityProvider).addLiquidity(tokens(100), tokens(100))
			await transaction.wait()
			transaction = await aggregator.connect(investor1).addLiquidity(tokens(200), tokens(200))
			await transaction.wait()

			const lpTotalAmtDeposited = await aggregator.userDeposits(liquidityProvider.address)
			expect(lpTotalAmtDeposited).to.equal(tokens(200))
			const investor1TotalAmtDeposited = await aggregator.userDeposits(investor1.address)
			expect(investor1TotalAmtDeposited).to.equal(tokens(400))
		})
	})

	/*describe('Removing Liquidity', () => {
		let transaction

		beforeEach(async () => {
			// Liqudity provider approves tokens for aggregator
			transaction = await token1.connect(liquidityProvider).approve(aggregator.address, tokens(500))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(aggregator.address, tokens(500))
			await transaction.wait()

			// Add liquidity
			transaction = await aggregator.connect(liquidityProvider).addLiquidity(tokens(500), tokens(500))
			await transaction.wait()
		})

		it('calculates withdrawal amounts', async () => {
			
		})

		it('removes liquidity', async () => {
			
		})
	})*/

	describe('Calculating Swap Prices', () => {
		let transaction

		beforeEach(async () => {
			// Liquidity provider approves tokens for AMMs
			transaction = await token1.connect(liquidityProvider).approve(amm1.address, tokens(20000))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(amm1.address, tokens(20000))
			await transaction.wait()
			transaction = await token1.connect(liquidityProvider).approve(amm2.address, tokens(20000))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(amm2.address, tokens(20000))
			await transaction.wait()

			// Liquidity provider adds liquidity for both AMMs
			transaction = await amm1.connect(liquidityProvider).addLiquidity(tokens(5000), tokens(5000))
			await transaction.wait()
			transaction = await amm2.connect(liquidityProvider).addLiquidity(tokens(1000), tokens(5000))
			await transaction.wait()
		})

		it('gets best token2 price and amm', async () => {
			const token2OutputAmm1 = await amm1.calculateToken1Swap(tokens(100))
			const token2OutputAmm2 = await amm2.calculateToken1Swap(tokens(100))

			const[bestToken2Output, bestAmm] = await aggregator.getBestToken1Price(tokens(100))

			expect(token2OutputAmm2).to.be.gt(token2OutputAmm1)
			expect(bestToken2Output).to.equal(token2OutputAmm2)
			expect(bestAmm).to.equal(amm2.address)
		})

		it('gets best token1 price and amm', async () => {
			const token1OutputAmm1 = await amm1.calculateToken2Swap(tokens(100))
			const token1OutputAmm2 = await amm2.calculateToken2Swap(tokens(100))

			const[bestToken1Output, bestAmm] = await aggregator.getBestToken2Price(tokens(100))

			expect(token1OutputAmm1).to.be.gt(token1OutputAmm2)
			expect(bestToken1Output).to.equal(token1OutputAmm1)
			expect(bestAmm).to.equal(amm1.address)
		})
	})

	describe('Swapping Tokens', () => {
		let transaction

		beforeEach(async () => {
			// Liquidity provider approves tokens for aggregator and AMMs
			transaction = await token1.connect(liquidityProvider).approve(aggregator.address, tokens(100000))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(aggregator.address, tokens(100000))
			await transaction.wait()
			transaction = await token1.connect(liquidityProvider).approve(amm1.address, tokens(100000))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(amm1.address, tokens(100000))
			await transaction.wait()
			transaction = await token1.connect(liquidityProvider).approve(amm2.address, tokens(100000))
			await transaction.wait()
			transaction = await token2.connect(liquidityProvider).approve(amm2.address, tokens(100000))
			await transaction.wait()

			// Liquidity provider adds liquidity to aggregator and AMMs
			transaction = await amm1.connect(liquidityProvider).addLiquidity(tokens(10000), tokens(50000))
			await transaction.wait()
			transaction = await amm2.connect(liquidityProvider).addLiquidity(tokens(50000), tokens(10000))
			await transaction.wait()

			// Investor #1 approves aggregator and AMMs to spend tokens
			transaction = await token1.connect(investor1).approve(aggregator.address, tokens(10000))
			await transaction.wait()
			transaction = await token2.connect(investor1).approve(aggregator.address, tokens(10000))
			await transaction.wait()
			transaction = await token1.connect(investor1).approve(amm1.address, tokens(10000))
			await transaction.wait()
			transaction = await token2.connect(investor1).approve(amm1.address, tokens(10000))
			await transaction.wait()
			transaction = await token1.connect(investor1).approve(amm2.address, tokens(10000))
			await transaction.wait()
			transaction = await token2.connect(investor1).approve(amm2.address, tokens(10000))
			await transaction.wait()
		})

		it('swaps token1 for best price', async () => {
			// Locate amm with best swap price for token1
			const [output, amm] = await aggregator.getBestToken1Price(tokens(500))
			expect(await amm).to.equal(amm1.address)

			// Check amm1 balance before swapping
			const amm1BalanceBefore = await amm1.token1Balance()

			// Swap tokens
			transaction = await aggregator.connect(investor1).executeSwapToken1(tokens(500))
			await transaction.wait()

			// Check amm1 balance after swapping
			const amm1BalanceAfter = await amm1.token1Balance()
			expect(amm1BalanceAfter).to.be.gt(amm1BalanceBefore)
		})

		it('swaps token2 for best price', async () => {
			// Locate amm with best swap price for token2
			const [output, amm] = await aggregator.getBestToken2Price(tokens(500))
			expect(await amm).to.equal(amm2.address)

			// Check amm2 balance before swapping
			const amm2BalanceBefore = await amm2.token2Balance()

			// Swap tokens
			transaction = await aggregator.connect(investor1).executeSwapToken2(tokens(500))
			await transaction.wait()

			// Check amm2 balance after swapping
			const amm2BalanceAfter = await amm2.token2Balance()
			expect(amm2BalanceAfter).to.be.gt(amm2BalanceBefore)
		})

		it('user receives tokens', async () => {
			// Get investor balances before swap
			const investorToken1Before = await token1.balanceOf(investor1.address)
			const investorToken2Before = await token2.balanceOf(investor1.address)

			// Swap tokens
			transaction = await aggregator.connect(investor1).executeSwapToken2(tokens(500))
			await transaction.wait()

			// Get investor balances after swap
			const investorToken1After = await token1.balanceOf(investor1.address)
			const investorToken2After = await token2.balanceOf(investor1.address)

			expect(investorToken1After).to.be.gt(investorToken1Before)
			expect(investorToken2After).to.be.lt(investorToken2Before)
		})

		it('emits ExecuteSwap event', async () => {
			// Get estimated output price
			const [estimate, amm] = await aggregator.getBestToken2Price(tokens(500))

			// Swap tokens
			transaction = await aggregator.connect(investor1).executeSwapToken2(tokens(500))
			await transaction.wait()

			await expect(transaction).to.emit(aggregator, 'ExecuteSwap')
        .withArgs(
          investor1.address,
          token2.address,
          tokens(500),
          token1.address,
          estimate,
          await aggregator.token1Balance(),
          await aggregator.token2Balance(),
          (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )
		})

		it('emits ExecuteSwap event', async () => {
			// Get estimated output price
			const [estimate, amm] = await aggregator.getBestToken1Price(tokens(500))

			// Swap tokens
			transaction = await aggregator.connect(investor1).executeSwapToken1(tokens(500))
			await transaction.wait()

			await expect(transaction).to.emit(aggregator, 'ExecuteSwap')
        .withArgs(
          investor1.address,
          token1.address,
          tokens(500),
          token2.address,
          estimate,
          await aggregator.token1Balance(),
          await aggregator.token2Balance(),
          (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
      )
		})
	})
})
