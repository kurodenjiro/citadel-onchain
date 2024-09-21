// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "base64-sol/base64.sol";

import {ByteHasher} from "./helpers/ByteHasher.sol";
import {IWorldID} from "./interfaces/IWorldID.sol";

contract TestCreditScoreNFT is ERC721, Ownable, ReentrancyGuard {
    using ByteHasher for bytes;
    using Strings for uint256;

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  ERRORS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when attempting to reuse a nullifier
    error DuplicateNullifier(uint256 nullifierHash);

    /// @dev The World ID instance that will be used for verifying proofs
    IWorldID internal worldId;

    /// @dev The contract's external nullifier hash
    uint256 internal externalNullifier;

    /// @dev The World ID group ID (always 1)
    uint256 internal immutable groupId = 1;

    /// @dev Whether a nullifier hash has been used already. Used to guarantee an action is only performed once by a single person
    mapping(uint256 => bool) internal nullifierHashes;

    /// @param nullifierHash The nullifier hash for the verified proof
    /// @dev A placeholder event that is emitted when a user successfully verifies with World ID
    event Verified(uint256 nullifierHash);

    using Counters for Counters.Counter;

    string baseURI;

    event CreditScoreNFTPurchased(address indexed buyer, uint256 tokenId);
    event ContractApproved(
        address indexed owner,
        address indexed contractAddress
    );
    event ContractRevoked(
        address indexed owner,
        address indexed contractAddress
    );
    event CreditScoreUpdated(
        uint256 tokenId,
        uint256 newCreditScore,
        address indexed updater
    );
    event NFTTransferred(
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    struct CreditScoreData {
        uint256 creditScore;
        address walletAddress;
        uint256 lastUpdated;
        int256 lastScoreChange;
        address lastUpdatedByContract;
    }

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => CreditScoreData) public creditScores;
    mapping(address => mapping(address => bool)) private _approvedContracts;
    mapping(address => uint256) private _addressToTokenId;
    mapping(uint256 => bool) private _lockedNFTs;
    mapping(address => mapping(address => uint256))
    private _lastUpdatedByContract;
    mapping(address => address[]) private _userApprovedContracts;

    // Mapping from owner address => (token ID => NFT type string)
    mapping(address => mapping(uint256 => string)) public ownerNftType;

    uint256 private constant initialCreditScore = 500;
    // uint256 private constant nftPrice = 0.00002 ether;

    constructor() ERC721("CidtadelScoreZ", "TEST") {}

    // Only Owner
    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    // Only Owner
    function setWorldId(
        IWorldID _worldId,
        string memory _appId,
        string memory _actionId
    ) external onlyOwner {
        worldId = _worldId;
        externalNullifier = abi
            .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
            .hashToField();
    }
    modifier notLocked(uint256 tokenId) {
        require(!_lockedNFTs[tokenId], "NFT is locked");
        _;
    }

    function lockNFT(uint256 tokenId, address sender) external {
        require(
            isContractApproved(ownerOf(tokenId), sender),
            "Contract not approved"
        );
        _lockedNFTs[tokenId] = true;
    }

    function unlockNFT(uint256 tokenId) external {
        require(
            isContractApproved(ownerOf(tokenId), msg.sender),
            "Contract not approved"
        );
        _lockedNFTs[tokenId] = false;
    }

    function buyCreditScoreNFT(
        string memory nftType,
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external payable nonReentrant {
        require(
            verify(signal, root, nullifierHash, proof) == true,
            "Verify Failed"
        );

        /// require(msg.value == nftPrice, "Incorrect payment value");
        require(_addressToTokenId[msg.sender] == 0, "User already owns an NFT");

        uint256 tokenId = _tokenIdCounter.current();
        if (tokenId != 0) {
            if (bytes(ownerNftType[msg.sender][tokenId]).length != 0) {
                require(
                    keccak256(
                        abi.encodePacked(ownerNftType[msg.sender][tokenId])
                    ) != keccak256(abi.encodePacked(nftType)),
                    "You already minted this type of NFT"
                );
            }
        }

        _tokenIdCounter.increment();

        CreditScoreData memory newCreditScore = CreditScoreData(
            initialCreditScore,
            msg.sender,
            block.timestamp,
            0,
            address(0)
        );
        creditScores[tokenId] = newCreditScore;
        _mint(msg.sender, tokenId);
        _addressToTokenId[msg.sender] = tokenId;
        ownerNftType[msg.sender][tokenId] = nftType;
        emit CreditScoreNFTPurchased(msg.sender, tokenId); // Emit event
    }

    /// @param signal An arbitrary input from the user, usually the user's wallet address (check README for further details)
    /// @param root The root of the Merkle tree (returned by the JS widget).
    /// @param nullifierHash The nullifier hash for this proof, preventing double signaling (returned by the JS widget).
    /// @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID (returned by the JS widget).
    /// @dev Feel free to rename this method however you want! We've used `claim`, `verify` or `execute` in the past.
    function verify(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) internal returns (bool) {
        // First, we make sure this person hasn't done this before
        if (nullifierHashes[nullifierHash])
            revert DuplicateNullifier(nullifierHash);

        // We now verify the provided proof is valid and the user is verified by World ID
        worldId.verifyProof(
            root,
            groupId,
            abi.encodePacked(signal).hashToField(),
            nullifierHash,
            externalNullifier,
            proof
        );

        // We now record the user has done this, so they can't do it again (proof of uniqueness)
        nullifierHashes[nullifierHash] = true;

        // Finally, execute your logic here, for example issue a token, NFT, etc...
        // Make sure to emit some kind of event afterwards!

        emit Verified(nullifierHash);

        return true;
    }

    function approveContract(address _contract) external {
        _approvedContracts[msg.sender][_contract] = true;
        _userApprovedContracts[msg.sender].push(_contract);
        emit ContractApproved(msg.sender, _contract); // Emit event
    }

    function revokeApproval(
        address _contract
    ) external notLocked(_addressToTokenId[msg.sender]) {
        _approvedContracts[msg.sender][_contract] = false;
        for (
            uint256 i = 0;
            i < _userApprovedContracts[msg.sender].length;
            i++
        ) {
            if (_userApprovedContracts[msg.sender][i] == _contract) {
                _userApprovedContracts[msg.sender][i] = _userApprovedContracts[
                    msg.sender
                ][_userApprovedContracts[msg.sender].length - 1];
                _userApprovedContracts[msg.sender].pop();
                break;
            }
        }
        emit ContractRevoked(msg.sender, _contract);
    }

    function getApprovedContracts(
        address user
    ) public view returns (address[] memory) {
        return _userApprovedContracts[user];
    }

    function isContractApproved(
        address owner,
        address _contract
    ) public view returns (bool) {
        return _approvedContracts[owner][_contract];
    }

    function updateCreditScore(uint256 tokenId, int256 scoreChange) external {
        address owner = ownerOf(tokenId);
        require(isContractApproved(owner, msg.sender), "Contract not approved");
        require(
            scoreChange >= -10 && scoreChange <= 10,
            "Score change must be within -10 to 10"
        );

        // Check if at least 1 day (86400 seconds) has passed since the last update by this contract for this user
        uint256 timeSinceLastUpdate = block.timestamp -
            _lastUpdatedByContract[msg.sender][owner];
        require(
            timeSinceLastUpdate >= 86400,
            "Credit score can only be updated once a day by each contract"
        );

        CreditScoreData storage creditScoreData = creditScores[tokenId];
        int256 newScore = int256(creditScoreData.creditScore) + scoreChange;

        require(newScore >= 350 && newScore <= 900, "Invalid credit score");

        creditScoreData.creditScore = uint256(newScore);
        creditScoreData.lastUpdated = block.timestamp;
        creditScoreData.lastScoreChange = scoreChange;
        creditScoreData.lastUpdatedByContract = msg.sender;

        // Update the last update timestamp for this contract and user pair
        _lastUpdatedByContract[msg.sender][owner] = block.timestamp;

        emit CreditScoreUpdated(tokenId, uint256(newScore), msg.sender); // Emit event
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(_addressToTokenId[to] == 0, "Receiver already owns an NFT");
        super._transfer(from, to, tokenId);
        _addressToTokenId[from] = 0;
        _addressToTokenId[to] = tokenId;
        creditScores[tokenId].walletAddress = to; // update wallet address for token

        emit NFTTransferred(from, to, tokenId); // Emit event
    }
    function getCreditScoreByAddress(
        address walletAddress
    ) public view returns (uint256 creditScore, uint256 lastUpdated) {
        uint256 tokenId = _addressToTokenId[walletAddress];

        // Check if the token ID exists and the wallet address is the owner of the token
        require(
            _exists(tokenId) && ownerOf(tokenId) == walletAddress,
            "User does not own a CreditScoreNFT"
        );

        CreditScoreData storage creditScoreData = creditScores[tokenId];
        return (creditScoreData.creditScore, creditScoreData.lastUpdated);
    }

    function getOwnerNftType(
        address owner,
        uint256 tokenId
    ) public view returns (string memory) {
        require(_exists(tokenId), "Token ID does not exist");
        require(
            ownerOf(tokenId) == owner,
            "Caller is not the owner of this token"
        );

        return ownerNftType[owner][tokenId];
    }

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "No funds available to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }

    function getLastScoreChangeDetails(
        address walletAddress
    )
        public
        view
        returns (int256 lastScoreChange, address lastUpdatedByContract)
    {
        uint256 tokenId = _addressToTokenId[walletAddress];
        require(
            _exists(tokenId) && ownerOf(tokenId) == walletAddress,
            "User does not own a CreditScoreNFT"
        );

        CreditScoreData storage creditScoreData = creditScores[tokenId];
        return (
            creditScoreData.lastScoreChange,
            creditScoreData.lastUpdatedByContract
        );
    }

    function isLocked(uint256 tokenId) public view returns (bool) {
        return _lockedNFTs[tokenId];
    }

    function _generateAttributes(
        string memory nftType,
        uint256 score
    ) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "[",
                    "{",
                    '"trait_type": "nftType",',
                    '"value": ',
                    nftType,
                    "},",
                    "{",
                    '"trait_type": "score",',
                    '"value": ',
                    score.toString(),
                    "},"
                    "]"
                )
            );
    }
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        CreditScoreData storage creditScoreData = creditScores[tokenId];
        string memory nftType = ownerNftType[ownerOf(tokenId)][tokenId];
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"CreditScore #',
                                tokenId.toString(),
                                ',"description":"This NFT represents an ad unit on thousandetherhomepage.com, the owner of the NFT controls the content of this ad unit."',
                                ',"external_url":""',
                                ',"image":"',
                                baseURI,
                                tokenId.toString(),
                                '.svg"',
                                ',"attributes":',
                                _generateAttributes(
                                    nftType,
                                    creditScoreData.creditScore
                                ),
                                "}"
                            )
                        )
                    )
                )
            );
    }
}
