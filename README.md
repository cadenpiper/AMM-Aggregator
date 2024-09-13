# AMM Swap Aggregator

This project aggregates the best swap between two amm smart contracts using one token pair. It features a faucet for users to interact with.

## Tools Used

<h4>
  <a href="https://docs.soliditylang.org/en/v0.8.0/"> Solidity Documentation</a> |
  <a href="https://hardhat.org/docs">Hardhat Documentation</a> |
  <a href="https://devdocs.io/react/">React Documentation</a> |
  <a href="https://docs.openzeppelin.com/">OpenZeppelin Documentation</a> |
</h4>

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v16.14.2)](https://nodejs.org/en/download/)
- [Npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/cadenpiper/AMM-Aggregator.git
npm install
```

2. Initialize Hardhat
```
npx hardhat
```

3. Run a local network in the first terminal:

```
npx hardhat node
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.js`.

4. On a second terminal, deploy the scripts:

```
npm run scripts/deploy.js --network localhost
npm run scripts/seed.js --network localhost
```

This command deploys the smart contracts to the local network. The contracts are located in `contracts/` and can be modified to suit your needs. You can also customize the deploy script.

5. On a third terminal, start your React app:

```
npm run start
```

Visit your app on: `http://localhost:3000`.

**What's next**:

- Edit your smart contract in `/contracts`
- Edit your frontend at `src/components/`.
- Edit your deployment scripts in `scripts/`
- Edit your smart contract test in: `test/`. To run test use `npx hardhat test`
