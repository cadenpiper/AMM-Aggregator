import { createSlice } from '@reduxjs/toolkit'

export const aggregator = createSlice({
	name: 'aggregator',
	initialState: {
		contract: null,
		shares: 0,
		swaps: [],
		swapping: {
			isSwapping: false,
			isSuccess: false,
			transactionHash: null
		},
		distributing: {
			isDistributing: false,
			isSuccess: false,
			transactionHash: null
		}
	},
	reducers: {
		setContract: (state, action) => {
			state.contract = action.payload	
		},
		swapRequest: (state, action) => {
			state.swapping.isSwapping = true
			state.swapping.isSuccess = false
			state.swapping.transactionHash = null
		},
		swapSuccess: (state, action) => {
			state.swapping.isSwapping = false
			state.swapping.isSuccess = true
			state.swapping.transactionHash = action.payload
		},
		swapFail: (state, action) => {
			state.swapping.isSwapping = false
			state.swapping.isSuccess = false
			state.swapping.transactionHash = null
		},
		faucetRequest: (state, action) => {
			state.distributing.isDistributing = true
			state.distributing.isSuccess = false
			state.distributing.transactionHash = null
		},
		faucetSuccess: (state, action) => {
			state.distributing.isDistributing = false
			state.distributing.isSuccess = true
			state.distributing.transactionHash = action.payload
		},
		faucetFail: (state, action) => {
			state.distributing.isDistributing = false
			state.distributing.isSuccess = false
			state.distributing.transactionHash = null
		},
	}
})

export const {
	setContract,
	swapRequest,
	swapSuccess,
	swapFail,
	faucetRequest,
	faucetSuccess,
	faucetFail
} = aggregator.actions;

export default aggregator.reducer;
