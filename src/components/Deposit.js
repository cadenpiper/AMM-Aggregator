import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import { ethers } from 'ethers'

import '../styles.css'
import Alert from './Alert'

import { addLiquidity, loadBalances } from '../store/interactions'

const Deposit = () => {
  const [token1Amount, setToken1Amount] = useState(0)
  const [token2Amount, setToken2Amount] = useState(0)

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)

  const aggregator = useSelector(state => state.aggregator.contract)

  const dispatch = useDispatch()

  const amountHandler = async (e) => {
    if (e.target.id === 'token1') {
      setToken1Amount(e.target.value)

      // Fetch value from chain
      const _token1Amount = ethers.utils.parseUnits(e.target.value, 'ether')
      const result = await aggregator.calculateToken2Deposit(_token1Amount)
      const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setToken2Amount(_token2Amount)
    } else {
      setToken2Amount(e.target.value)

      // Fetch value from chain
      const _token2Amount = ethers.utils.parseUnits(e.target.value, 'ether')
      const result = await aggregator.calculateToken1Deposit(_token2Amount)
      const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setToken1Amount(_token1Amount)
    }
  }

  const depositHandler = async (e) => {
    e.preventDefault()

    const _token1Amount = ethers.utils.parseUnits(token1Amount, 'ether')
    const _token2Amount = ethers.utils.parseUnits(token2Amount, 'ether')
    
    await addLiquidity(provider, aggregator, tokens, [_token1Amount, _token2Amount], dispatch)

    await loadBalances(aggregator, tokens, account, dispatch)
  }

  return(
    <div className="swap-container">
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4 swap-card'>
        {account ? (
          <Form onSubmit={depositHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>

            <Row>
              <Form.Text className='text-end my-2' muted>
                Balance: {balances[0]}
              </Form.Text>
              <InputGroup>
                <Form.Control 
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  id="token1"
                  onChange={(e) => amountHandler(e)}
                  value={token1Amount === 0 ? "" : token1Amount}
                  className="form-control-custom"
                />
                <InputGroup.Text style={{ width: '100px' }} className='justify-content-center'>
                  { symbols && symbols[0] }
                </InputGroup.Text>
              </InputGroup>
            </Row>

            <Row className='my-3'>
              <Form.Text className='text-end my-2' muted>
                Balance: {balances[1]}
              </Form.Text>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder='0.0'
                  step="any"
                  id="token2"
                  onChange={(e) => amountHandler(e)}
                  value={token2Amount === 0 ? "" : token2Amount}
                  className="form-control-custom"
                />
                <InputGroup.Text style={{ width: '100px' }} className='justify-content-center'>
                  { symbols && symbols[1] }
                </InputGroup.Text>
              </InputGroup>
            </Row>

            <Row className='my-3'>
              <Button type='submit' className="button">Deposit</Button>

              <Form.Text muted>
                Exchange Rate:
              </Form.Text>
            </Row>

          </Form>
        ) : (
          <p
            className='d-flex justify-content-center align-items-center swap-connect-wallet-text'
            style={{ height: '350px' }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>

    </div>
  );
}

export default Deposit;
