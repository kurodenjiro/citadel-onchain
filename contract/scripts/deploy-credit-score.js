const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const creditScoreContractFactory = await ethers.getContractFactory("TestCreditScoreNFT");
  const creditScore = await creditScoreContractFactory.deploy();
  const creditScoreContract = await creditScore.waitForDeployment();
  console.log("Credit Score deployed to:", creditScoreContract.target);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error, "Error Here");
    process.exit(1);
  });