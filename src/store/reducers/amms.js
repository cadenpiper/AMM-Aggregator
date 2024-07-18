import { createSlice } from '@reduxjs/toolkit'

export const amms = createSlice({
	name: 'amms',
	initialState: {
		ammContracts: [],
		shares: 0,
		ammTokenBalances: []
	},
	reducers: {
		setAmmContracts: (state, action) => {
			state.ammContracts = action.payload
		},
		sharesLoadedAmm: (state, action) => {
			state.ammShares = action.payload
		},
		setBalances: (state, action) => {
			state.ammTokenBalances = action.payload
		}
	}
})

export const { setAmmContracts, sharesLoadedAmm, setBalances } = amms.actions;

export default amms.reducer;
