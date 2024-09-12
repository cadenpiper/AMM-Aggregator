import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

import '../styles.css'

// Components
import Navigation from './Navigation'
import Swap from './Swap'
import Faucet from './Faucet'
import Tabs from './Tabs'

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAmms,
  loadAggregator
} from '../store/interactions'

function App() {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = await loadProvider(dispatch)

    // Fetch current networks chainId
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', async () => {
      window.location.reload()
    })

    // Fetch current account from Metamask when changed
    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch)
    })

    // Initate contracts
    await loadTokens(provider, chainId, dispatch)
    await loadAmms(provider, chainId, dispatch)
    await loadAggregator(provider, chainId, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  }, []);

  return(
    <Container>
      <HashRouter>

        <Navigation />

        <hr />

        <Tabs />

        <Routes>
          <Route exact path='/' element={<Swap />} />
          <Route exact path='/faucet' element={<Faucet />} />
        </Routes>

      </HashRouter>

    </Container>
  )
}

export default App;
