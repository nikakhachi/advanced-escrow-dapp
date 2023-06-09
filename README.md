# SecureTransaction (Escrow dApp)

The dApp named "SecureTransaction" is enabling users to initiate escrows for their transactions. Intermediary agents handle escrow initiation, cancellation, and rejection. Agents receive a fee from successful escrows and everyone can apply to become an agent once they have been approved by the smart contract owner.

The contract is deployed on Goerli Network- [Etherscan](https://goerli.etherscan.io/address/0xB111c934A6132BB23D56AA4F7cf845bdc453CbC9)

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Development](#development)
- [Contact](#contact)

## Features

- Smart contract deployment and interaction using Hardhat in Typescript
- Smart contract tests in Typescript
- User-friendly interface built with ReactJS in Typescript
- Web3 integration with EthersJS for seamless interaction with Ethereum network

## Prerequisites

Before running the dApp, ensure that you have the following installed:

- Node.js
- npm (Node Package Manager)
- MetaMask extension for your browser

## Getting Started

Follow the steps below to get the dApp up and running:

1. Clone this repository to your local machine.
2. Install the project dependencies by running `npm install` in the root directory as well as in `client` directory.
3. Configure your MetaMask extension to connect to the desired Ethereum network.
4. Deploy the smart contracts to the Ethereum network using Hardhat: `npx hardhat run scripts/deploy.js --network <network-name>`.
5. Update the `ESCROW_ADDRESS` variable in `client/src/contracts/escrow.ts`.
6. Start the client: `cd client && npm run dev`.
7. Access the dApp by opening your browser and visiting `http://localhost:5173`.

## Usage

- Connect your MetaMask extension to the dApp by clicking on the MetaMask icon and approving the connection.
- Explore the various features and functionalities of the dApp interface.
- Interact with smart contracts by sending transactions and interacting with contract methods.
- View transaction history and account details.

## Development

To contribute to the development of this dApp, follow the steps below:

1. Fork this repository and clone it to your local machine.
2. Create a new branch for your changes: `git checkout -b my-new-feature`.
3. Get the dApp up and running following steps in [Getting Started](#getting-started).
4. Make the necessary modifications and additions.
5. Test Smart Contract with `npx hardhat test` in the root directory.
6. Commit and push your changes: `git commit -m 'Add some feature' && git push origin my-new-feature`.
7. Submit a pull request detailing your changes and their benefits.

## Contact

For any questions or inquiries, please contact [Nika Khachiashvili](mailto:n.khachiashvili1@gmail.com).
