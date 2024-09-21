const hre = require("hardhat");
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  const [deployer] = await hre.ethers.getSigners()

  // Deploy tokens
  const Token = await hre.ethers.getContractFactory('Token')

  let token1 = await Token.deploy('Token1', 'TKN1', '1000000')
  await token1.deployed()
  console.log(`\nToken1 address: ${token1.address}`)
  let token2 = await Token.deploy('Token2', 'TKN2', '1000000')
  await token2.deployed()
  console.log(`\nToken2 address: ${token2.address}\n`)

  // Deploy AMMs
  const AMM = await hre.ethers.getContractFactory('AMM')

  let amm1 = await AMM.deploy('Amm1', token1.address, token2.address)
  await amm1.deployed()
  console.log(`Amm1 address: ${amm1.address}\n`)
  let amm2 = await AMM.deploy('Amm2', token1.address, token2.address)
  await amm2.deployed()
  console.log(`Amm2 address: ${amm2.address}\n`)

  // Deployer adds liquidity to AMMs
  let transaction = await token1.connect(deployer).approve(amm1.address, tokens(100000))
  await transaction.wait()
  transaction = await token2.connect(deployer).approve(amm1.address, tokens(100000))
  await transaction.wait()
  transaction = await token1.connect(deployer).approve(amm2.address, tokens(100000))
  await transaction.wait()
  transaction = await token2.connect(deployer).approve(amm2.address, tokens(100000))
  await transaction.wait()

  transaction = await amm1.connect(deployer).addLiquidity(tokens(100000), tokens(100000))
  await transaction.wait()
  transaction = await amm2.connect(deployer).addLiquidity(tokens(100000), tokens(100000))
  await transaction.wait()

  // Deploy aggregator
  const Aggregator = await hre.ethers.getContractFactory('Aggregator')

  let aggregator = await Aggregator.deploy(
    'Aggregator',
    token1.address,
    token2.address,
    amm1.address,
    amm2.address,
  )
  await aggregator.deployed()
  console.log(`Aggregator address: ${aggregator.address}\n`)

  // Give tokens to contract for faucet
  transaction = await token1.connect(deployer).transfer(aggregator.address, tokens(100000))
  await transaction.wait()
  transaction = await token2.connect(deployer).transfer(aggregator.address, tokens(100000))
  await transaction.wait()
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
