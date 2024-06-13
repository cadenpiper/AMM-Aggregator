import { ethers } from 'ethers'

import { setProvider, setNetwork, setAccount } from './reducers/provider'
import { setContracts, setSymbols, balancesLoaded } from './reducers/tokens'
import { setContract } from './reducers/aggregator'

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

export const loadAggregator = async (provider, chainId, dispatch) => {
	const aggregator = new ethers.Contract(config[chainId].aggregator.address, AGGREGATOR_ABI, provider)

	dispatch(setContract(aggregator))

	return aggregator
}

// -----------------------------
// Load Balances & Shares

export const loadBalances = async (tokens, account, dispatch) => {
	const balance1 = await tokens[0].balanceOf(account)
	const balance2 = await tokens[1].balanceOf(account)

	dispatch(balancesLoaded(balance1, balance2))
}
