#  Credit Score NFT Contract 

Hardhat | Ethers | Javascript to compile and test a Credit Score NFT Smart Contract

## Prerequisites

- Node >= 16.0
- npm

## Steps
### Smart contract
1. Compile credit score NFT smart contract 
    ```
    + Set PRIVATE_KEY in .env file ( Create new .env file , get configuration from .env.example)

    + npx hardhat compile
2. Deploying contract
    ```
    npx hardhat run --network sepolia scripts/deploy.ts
    ```
    Contract address will be shown in the terminal:
    ```
    Credit Score deployed to: 0xE1F9b6ba798AB0830703Fc964A5FdC4B7d181D1B
    ```

3. Verify contract

```
npx hardhat verify <contract address> --network sepolia
```