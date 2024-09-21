require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()
module.exports = {
  solidity: "0.8.20",
  networks: {
    // qa: {
    //   url: "https://rpc.qa.5ire.network",
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    thunder: {
      url: 'https://rpc.testnet.5ire.network',
      chainId: 997,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],

    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/ef11842f857140a4b8c407dba6c7aa8d",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      qa: process.env.ETHERSCAN_API,
      thunder: process.env.ETHERSCAN_API,
      sepolia: process.env.ETHERSCAN_API
    },
    customChains: [
      // {
      //   network: "qa",
      //   chainId: 997,
      //   urls: {
      //     apiURL: "https://contract.evm.qa.5ire.network/5ire/verify",
      //     browserURL: "https://scan.qa.5ire.network",
      //   },
      // },
      {
        network: "thunder",
        chainId: 997,
        urls: {
          apiURL: "https://contract.evm.testnet.5ire.network/5ire/verify",
          browserURL: "https://testnet.5irescan.io",
        },
      },
    ],
  },
}; 