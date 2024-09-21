const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  const mockTokenContractFactory = await ethers.getContractFactory("MockToken");
  const mockToken = await mockTokenContractFactory.deploy("MockToken","TKA", 18);
  const mockTokenContract = await mockToken.waitForDeployment();
  console.log("Mock Token deployed to:", mockTokenContract.target);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error, "Error Here");
    process.exit(1);
  });