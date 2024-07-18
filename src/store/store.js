import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import amms from './reducers/amms'
import aggregator from './reducers/aggregator'

export const store = configureStore({
	reducer: {
		provider,
		tokens,
		amms,
		aggregator
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
})
