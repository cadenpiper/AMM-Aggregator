import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from "react-router-bootstrap";

import '../styles.css'

const Tabs = () => {
  return (
    <Nav variant="pills" defaultActiveKey="/" className='justify-content-center my-5'>
      <LinkContainer to="/">
        <Nav.Link>Swap</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/faucet">
        <Nav.Link>Faucet</Nav.Link>
      </LinkContainer>
    </Nav>
  );
}

export default Tabs;
