const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("TestCreditScoreNFT", function () {

  let TestCreditScoreNFT, testCreditScoreNFT, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    TestCreditScoreNFT = await ethers.getContractFactory("TestCreditScoreNFT");
    testCreditScoreNFT = await TestCreditScoreNFT.deploy();
    await testCreditScoreNFT.waitForDeployment();
  });

  it("Should mint a new NFT and set initial credit score", async function () {
    const nftType = "Netflix";

    const tx = await testCreditScoreNFT.connect(addr1).buyCreditScoreNFT(nftType);
    await tx.wait();
    const tokenId = 0;
    const creditScoreData = await testCreditScoreNFT.creditScores(tokenId);

    expect(creditScoreData.creditScore).to.equal(500);
    expect(await testCreditScoreNFT.ownerOf(tokenId)).to.equal(addr1.address);

    const storedNftType = await testCreditScoreNFT.getOwnerNftType(addr1.address, tokenId);
    expect(storedNftType).to.equal(nftType);

    await expect(
      testCreditScoreNFT.connect(addr1).buyCreditScoreNFT(nftType)
  ).to.be.revertedWith("You already minted this type of NFT");


  });

  it("Should lock and unlock NFT by approved contract", async function () {
    const nftType = "Netflix";

    const tx = await testCreditScoreNFT.connect(addr1).buyCreditScoreNFT(nftType);
    const tokenId = 0

    await testCreditScoreNFT.connect(addr1).approveContract(addr2.address);
    await testCreditScoreNFT.connect(addr2).lockNFT(tokenId, addr2.address);
    let isLocked = await testCreditScoreNFT.isLocked(tokenId);
    expect(isLocked).to.equal(true);

    await testCreditScoreNFT.connect(addr2).unlockNFT(tokenId);
    isLocked = await testCreditScoreNFT.isLocked(tokenId);
    expect(isLocked).to.equal(false);
  });

  it("Should update credit score by approved contract", async function () {
    const nftType = "Netflix";

    const tx = await testCreditScoreNFT.connect(addr1).buyCreditScoreNFT(nftType);
    const tokenId = 0;

    await testCreditScoreNFT.connect(addr1).approveContract(addr2.address);
    await testCreditScoreNFT.connect(addr2).updateCreditScore(tokenId, 5);

    const updatedCreditScore = await testCreditScoreNFT.creditScores(tokenId);
    expect(updatedCreditScore.creditScore).to.equal(505);
  });

  it("Should revoke contract approval", async function () {
    const nftType = "Netflix";

    const tx = await testCreditScoreNFT.connect(addr1).buyCreditScoreNFT(nftType);

    await testCreditScoreNFT.connect(addr1).approveContract(addr2.address);
    await testCreditScoreNFT.connect(addr1).revokeApproval(addr2.address);

    const isApproved = await testCreditScoreNFT.isContractApproved(addr1.address, addr2.address);
    expect(isApproved).to.equal(false);
  });

});