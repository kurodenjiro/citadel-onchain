const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();

  const creditContract = "";
  const tokenContract = "";
  const uri = "";

  console.log("Deploying contracts with the account:", deployer.address);
  const lendingContractFactory = await ethers.getContractFactory("Lending");
  const lending = await lendingContractFactory.deploy(tokenContract, creditContract, uri);
  const lendingContract = await lending.waitForDeployment();
  console.log("Lending deployed to:", lendingContract.target);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error, "Error Here");
    process.exit(1);
  });