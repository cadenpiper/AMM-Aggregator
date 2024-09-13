import { useState } from 'react'
import Card from 'react-bootstrap/Card';
import { useSelector, useDispatch } from 'react-redux'
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import Alert from './Alert'

import '../styles.css'
import { loadBalances, faucet } from '../store/interactions'

const Faucet = () => {

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)

  const [showAlert, setShowAlert] = useState(false)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)
  const balances = useSelector(state => state.tokens.balances)

  const aggregator = useSelector(state => state.aggregator.contract)

  const isDistributing = useSelector(state => state.aggregator.distributing.isDistributing)
  const isSuccess = useSelector(state => state.aggregator.distributing.isSuccess)
  const transactionHash = useSelector(state => state.aggregator.distributing.transactionHash)

  const dispatch = useDispatch()

  const faucetHandler = async (e) => {
    e.preventDefault()

    setShowAlert(false)

    await faucet(provider, aggregator, account, dispatch)

    setShowAlert(true)

    await loadBalances(aggregator, tokens, account, dispatch)
  }

  return (
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4 swap-card'>
        {account ? (
          <Form onSubmit={faucetHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
            <Row className='my-1'>
              <Button type="submit" className="button" style={{ marginTop: '-22px' }}>Receive Tokens</Button>
            </Row>

            <hr/>

            <Row>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px' }}>
                <p style={{ marginBottom: '-7px' }}><strong>Token1 Balance:</strong> {balances[0]}</p>
                <Form.Text muted>
                  Token1 address: {tokens[0].address}
                </Form.Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px', marginTop: '20px' }}>
                <p style={{ marginBottom: '-7px' }}><strong>Token2 Balance:</strong> {balances[1]}</p>
                <Form.Text muted>
                  Token2 address: {tokens[1].address}
                </Form.Text>
              </div>
            </Row>
          </Form>
        ) : (
          <p
            className='d-flex justify-content-center align-items-center'
            style={{ height: '300px' }}
          >
            Please connect wallet.
          </p>

        )}
      </Card>

      {isDistributing ? (
        <Alert 
          message={'Faucet funds Pending...'}
          transactionHash={null}
          variant={'info'}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (
        <Alert 
          message={'Faucet Successful'}
          transactionHash={transactionHash}
          variant={'success'}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (
        <Alert 
          message={'Faucet Failed'}
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

export default Faucet;
