const hre = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

async function main() {
  // Fetch accunts
  console.log(`Fetching accounts and network...\n\n`)
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  const liquidityProvider = accounts[1]
  const investor1 = accounts[2]
  const investor2 = accounts[3]
  const investor3 = accounts[4]
  const investor4 = accounts[5]

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork()
  console.log(`\nFetching tokens and transferring to accounts...\n`)

  // Fetch tokens
  const token1 = await ethers.getContractAt('Token', config[chainId].token1.address)
  console.log(`Token1 fetched: ${token1.address}\n`)
  const token2 = await ethers.getContractAt('Token', config[chainId].token2.address)
  console.log(`Token2 fetched: ${token2.address}\n\n`)

  /////////////////////////////////////////////////
  // Distribute tokens to invesors and liquidity provider

  let transaction

  // Send token1 and token2 to liquidity provider
  transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(50000))
  await transaction.wait()
  transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(50000))
  await transaction.wait()

  // Send token1 to investor1
  transaction = await token1.connect(deployer).transfer(investor1.address, tokens(10))
  await transaction.wait()

  // Send token2 to investor2
  transaction = await token2.connect(deployer).transfer(investor2.address, tokens(10))
  await transaction.wait()

  // Send token1 to investor3
  transaction = await token1.connect(deployer).transfer(investor3.address, tokens(10))
  await transaction.wait()

  // Send token2 to investor4
  transaction = await token2.connect(deployer).transfer(investor4.address, tokens(10))
  await transaction.wait()



  console.log(`\nFetching amms...\n`)

  // Fetch AMMs
  const amm1 = await ethers.getContractAt('AMM', config[chainId].amm1.address)
  console.log(`Amm1 fetched: ${amm1.address}\n`)
  const amm2 = await ethers.getContractAt('AMM', config[chainId].amm2.address)
  console.log(`Amm2 fetched: ${amm2.address}\n\n`)

  /////////////////////////////////////////////////
  // Add Liquidity to AMMs
  console.log(`\nAdding liquidity to AMMs...\n`)

  // Approve amms
  transaction = await token1.connect(liquidityProvider).approve(amm1.address, tokens(10000))
  await transaction.wait()
  transaction = await token2.connect(liquidityProvider).approve(amm1.address, tokens(10000))
  await transaction.wait()
  transaction = await token1.connect(liquidityProvider).approve(amm2.address, tokens(10000))
  await transaction.wait()
  transaction = await token2.connect(liquidityProvider).approve(amm2.address, tokens(10000))
  await transaction.wait()

  transaction = await amm1.connect(liquidityProvider).addLiquidity(tokens(10000), tokens(10000))
  await transaction.wait()
  transaction = await amm2.connect(liquidityProvider).addLiquidity(tokens(10000), tokens(10000))
  await transaction.wait()



  // Fetch aggregator
  console.log(`\nFetching aggregator...\n`)

  const aggregator = await ethers.getContractAt('Aggregator', config[chainId].aggregator.address)
  console.log(`Aggregator fetched: ${aggregator.address}\n\n`)

  // Transfer tokens to aggregator
  transaction = await token1.connect(deployer).transfer(aggregator.address, tokens(10000))
  await transaction.wait()
  transaction = await token2.connect(deployer).transfer(aggregator.address, tokens(10000))
  await transaction.wait()

  /////////////////////////////////////////////////
  // Swap tokens

  // investor1 swaps token1 for token2
  console.log(`\nInvestor 1 swaps...\n`)

  // investor1 approves tokens
  transaction = await token1.connect(investor1).approve(aggregator.address, tokens(10))
  await transaction.wait()

  // swap
  transaction = await aggregator.connect(investor1).executeSwapToken1(tokens(1))
  await transaction.wait()


  // investor2 swaps token2 for token1
  console.log(`Investor 2 swaps...\n`)

  // investor2 approves tokens
  transaction = await token2.connect(investor2).approve(aggregator.address, tokens(10))
  await transaction.wait()

  // swap
  transaction = await aggregator.connect(investor2).executeSwapToken2(tokens(1))
  await transaction.wait()


  // investor3 swaps token1 for token2
  console.log(`Investor 3 swaps...\n`)

  // investor3 approves tokens
  transaction = await token1.connect(investor3).approve(aggregator.address, tokens(10))
  await transaction.wait()

  // swap
  transaction = await aggregator.connect(investor3).executeSwapToken1(tokens(10))
  await transaction.wait()


  // investor4 swaps token2 for token1
  console.log(`Investor 4 swaps...\n\n`)

  // investor4 approves tokens
  transaction = await token2.connect(investor4).approve(aggregator.address, tokens(10))
  await transaction.wait()

  // swap
  transaction = await aggregator.connect(investor4).executeSwapToken2(tokens(5))


  console.log('\nFinished\n')
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
