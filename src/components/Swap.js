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

import { swap, loadBalances } from '../store/interactions'

const Swap = () => {
  const [inputToken, setInputToken] = useState(null)
  const [outputToken, setOutputToken] = useState(null)
  const [inputAmount, setInputAmount] = useState(0)
  const [outputAmount, setOutputAmount] = useState(0)

  const [price, setPrice] = useState(0)

  const [showAlert, setShowAlert] = useState(false)

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)

  const aggregator = useSelector(state => state.aggregator.contract)
  const amms = useSelector(state => state.amms.ammContracts)
  
  const isSwapping = useSelector(state => state.aggregator.swapping.isSwapping)
  const isSuccess = useSelector(state => state.aggregator.swapping.isSuccess)
  const transactionHash = useSelector(state => state.aggregator.swapping.transactionHash)

  const dispatch = useDispatch()

  const inputHandler = async (e) => {
    if (!inputToken || !outputToken) {
      window.alert('Please select token')
      return
    }

    if (inputToken === outputToken) {
      window.alert('Invalid token pair')
      return
    }

    const value = e.target.value
    setInputAmount(value)

    if (inputToken === 'TKN1') {
      const _token1Amount = ethers.utils.parseUnits(value, 'ether')
      const [result, address] = await aggregator.getBestToken1Price(_token1Amount)
      const _token2Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setOutputAmount(_token2Amount.toString())

    } else {
      const _token2Amount = ethers.utils.parseUnits(value, 'ether')
      const [result, address] = await aggregator.getBestToken2Price(_token2Amount)
      const _token1Amount = ethers.utils.formatUnits(result.toString(), 'ether')

      setOutputAmount(_token1Amount.toString())
    }
  }

  const swapHandler = async (e) => {
    e.preventDefault()

    setShowAlert(false)

    if (inputToken === outputToken) {
      window.alert('Invalid Token Pair')
      return
    }

    const _inputAmount = ethers.utils.parseUnits(inputAmount, 'ether')

    if (inputToken === "TKN1") {
      await swap(provider, aggregator, tokens[0], inputToken, _inputAmount, dispatch)
    } else {
      await swap(provider, aggregator, tokens[1], inputToken, _inputAmount, dispatch)
    }

    await loadBalances(aggregator, tokens, account, dispatch)
    await getPrice()

    setShowAlert(true)
  }

  const getPrice = async () => {
    if (inputToken === outputToken) {
      setPrice(0)
      return
    }

    const amm1Token1Balance = await amms[0].token1Balance()
    const amm1Token2Balance = await amms[0].token2Balance()
    const amm2Token1Balance = await amms[1].token1Balance()
    const amm2Token2Balance = await amms[1].token2Balance()

    if (inputToken === 'TKN1') {
      if (amm1Token1Balance / amm1Token2Balance > amm2Token1Balance / amm2Token2Balance) {
        setPrice(amm1Token1Balance / amm1Token2Balance)
      } else {
        setPrice(amm2Token1Balance / amm2Token2Balance)
      }
    } else {
      if (amm1Token2Balance / amm1Token1Balance > amm2Token2Balance / amm2Token1Balance) {
        setPrice(amm1Token2Balance / amm1Token1Balance)
      } else {
        setPrice(amm2Token2Balance / amm2Token1Balance)
      }
    }
  }

  useEffect(() => {
    if(inputToken && outputToken) {
      getPrice()
    }
  }, [inputToken, outputToken]);

  return(
    <div className="swap-container">
      <Card style={{ maxWidth: '450px', marginTop: '-35px' }} className='mx-auto px-4 swap-card'>
        {account ? (
          <Form onSubmit={swapHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            <Row className='my-3'>
              <div className='d-flex justify-content-between'>
                <Form.Label className="form-label"><strong>Input:</strong></Form.Label>
                <Form.Text className="form-text-muted">
                  Balance: {
                    inputToken === symbols[0] ? (
                      balances[0]
                    ) : inputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control 
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  onChange={(e) => inputHandler(e)}
                  disabled={!inputToken}
                  className="form-control-custom"
                />
                <DropdownButton
                  variant="outline-secondary"
                  title={inputToken ? inputToken : "Select Token"}
                  className="dropdown-button-custom"
                >
                  <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >TKN1</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >TKN2</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>

            <Row className='my-4'>
              <div className='d-flex justify-content-between'>
                <Form.Label className="form-label"><strong>Output:</strong></Form.Label>
                <Form.Text className="form-text-muted">
                  Balance: {
                    outputToken === symbols[0] ? (
                      balances[0]
                    ) : outputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder='0.0'
                  value={outputAmount === 0 ? "" : outputAmount}
                  disabled
                />
                <DropdownButton
                  variant="outline-secondary"
                  title={outputToken ? outputToken : "Select Token"}
                  className="dropdown-button-custom"
                >
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)} >TKN1</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)} >TKN2</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>

            <Row className='my-3'>
              {isSwapping ? (
                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
              ) : (
                <Button type='submit' className="button">Swap</Button>
              )}

              <Form.Text muted>
                Exchange Rate: {price}
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

      {isSwapping ? (
        <Alert 
          message={'Swap Pending...'}
          transactionHash={null}
          variant={'info'}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (
        <Alert 
          message={'Swap Successful'}
          transactionHash={transactionHash}
          variant={'success'}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (
        <Alert 
          message={'Swap Failed'}
          transactionHash={null}
          variant={'danger'}
          setShowAlert={setShowAlert}
        />
      ) : (
        <></>
      )}

    </div>
  );
}

export default Swap;
