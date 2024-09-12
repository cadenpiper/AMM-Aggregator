import { ethers } from 'ethers'

import { setProvider, setNetwork, setAccount } from './reducers/provider'
import { setContracts, setSymbols, balancesLoaded } from './reducers/tokens'
import { setAmmContracts, sharesLoadedAmm, setBalances } from './reducers/amms'
import {
	setContract,
	swapRequest,
	swapSuccess,
	swapFail,
	faucetRequest,
	faucetSuccess,
	faucetFail
} from './reducers/aggregator'

import TOKEN_ABI from '../abis/Token.json';
import AMM_ABI from '../abis/AMM.json';
import AGGREGATOR_ABI from '../abis/Aggregator.json';
import config from '../config.json';

export const loadProvider = (dispatch) => {
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	dispatch(setProvider(provider))

	return provider
}

export const loadNetwork = async (provider, dispatch) => {
	const { chainId } = await provider.getNetwork()
	dispatch(setNetwork(chainId))

	return chainId
}

export const loadAccount = async (dispatch) => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const account = ethers.utils.getAddress(accounts[0])
  dispatch(setAccount(account))

  return account
}

// -----------------------------
// Load Contracts

export const loadTokens = async (provider, chainId, dispatch) => {
	const token1 = new ethers.Contract(config[chainId].token1.address, TOKEN_ABI, provider)
	const token2 = new ethers.Contract(config[chainId].token2.address, TOKEN_ABI, provider)

	dispatch(setContracts([token1, token2]))
	dispatch(setSymbols([await token1.symbol(), await token2.symbol()]))
}

export const loadAmms = async (provider, chainId, dispatch) => {
	const amm1 = new ethers.Contract(config[chainId].amm1.address, AMM_ABI, provider)
	const amm2 = new ethers.Contract(config[chainId].amm2.address, AMM_ABI, provider)

	const balance1 = await amm1.token1Balance()
	const balance2 = await amm1.token2Balance()
	const balance3 = await amm2.token1Balance()
	const balance4 = await amm2.token2Balance()

	dispatch(setAmmContracts([amm1, amm2]))
	dispatch(setBalances([
		ethers.utils.formatUnits(balance1.toString(), 'ether'),
		ethers.utils.formatUnits(balance2.toString(), 'ether'),
		ethers.utils.formatUnits(balance3.toString(), 'ether'),
		ethers.utils.formatUnits(balance4.toString(), 'ether')
	]))
}

export const loadAggregator = async (provider, chainId, dispatch) => {
	const aggregator = new ethers.Contract(config[chainId].aggregator.address, AGGREGATOR_ABI, provider)

	dispatch(setContract(aggregator))

	return aggregator
}

// -----------------------------
// Faucet

export const faucet = async (provider, aggregator, account, dispatch) => {
	try {
		dispatch(faucetRequest())

		const signer = await provider.getSigner()

		let transaction = await aggregator.connect(signer).distributeTokens()
		await transaction.wait()

		dispatch(faucetSuccess(transaction.hash))
	} catch (error) {
		console.log(error)
		dispatch(faucetFail())
	}
}

// -----------------------------
// Load Balances

export const loadBalances = async (aggregator, tokens, account, dispatch) => {
	const balance1 = await tokens[0].balanceOf(account)
	const balance2 = await tokens[1].balanceOf(account)

	dispatch(balancesLoaded([
		ethers.utils.formatUnits(balance1.toString(), 'ether'),
		ethers.utils.formatUnits(balance2.toString(), 'ether')
	]))
}

// -----------------------------
// Swap

export const swap = async (provider, aggregator, token, symbol, amount, dispatch) => {
	try {

		dispatch(swapRequest())

		let transaction

		const signer = await provider.getSigner()

		transaction = await token.connect(signer).approve(aggregator.address, amount)
		await transaction.wait()

		if (symbol === "TKN1") {
			transaction = await aggregator.connect(signer).executeSwapToken1(amount)
		} else {
			transaction = await aggregator.connect(signer).executeSwapToken2(amount)
		}

		await transaction.wait()

		dispatch(swapSuccess(transaction.hash))

	} catch (error) {
		dispatch(swapFail())
	}
}
