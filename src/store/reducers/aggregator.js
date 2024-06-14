import { createSlice } from '@reduxjs/toolkit'

export const aggregator = createSlice({
	name: 'aggregator',
	initialState: {
		contract: null,
		shares: 0,
		swaps: []
	},
	reducers: {
		setContract: (state, action) => {
			state.contract = action.payload	
		},
		sharesLoaded: (state, action) => {
			state.shares = action.payload
		}
	}
})

export const { setContract, sharesLoaded } = aggregator.actions;

export default aggregator.reducer;
