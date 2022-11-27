//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// import interface
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__PriceBelowZero();
error NftMarketplace__MarketplaceNotApproved();
error NftMarketplace__NftAlreadyListed();
error NftMarketplace__NotOwner();
error NftMarketplace__NftNotListed();
error NftMarketplace__InsufficientTransfer(
    address nftAddress,
    uint256 tokenId,
    uint256 nftPrice
);
error NftMarketplace__NoHoldings();
error NftMarketplace__TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 nftPrice
    );

    event ItemRemoved(
        address indexed sender,
        address indexed nftAddress,
        uint256 tokenId
    );

    //Listed NFT contract -> (NFT TokenId(which NFT) -> Listing)
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    //Seller Address => Amount Earned   (Amount to be given by marketplace to the seller)
    mapping(address => uint256) private s_lockedValue;

    constructor() {}

    // modifier to make sure that same nft shouldnt be listed twice
    modifier isListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__NftAlreadyListed();
        }
        _;
    }

    // only the owner(minter) of the nft should be able to list the nft on the marketplace
    //only owner of the nft should cancel its listings
    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address sender
    ) {
        IERC721 nft = IERC721(nftAddress);
        // get owner via tokenId
        address owner = nft.ownerOf(tokenId);
        if (sender != owner) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    //before purchasing any nft make sure its listed
    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory nft = s_listings[nftAddress][tokenId];
        if (nft.price <= 0) {
            revert NftMarketplace__NftNotListed();
        }
        _;
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketplace__PriceBelowZero();
        }
        IERC721 nft = IERC721(nftAddress);
        // check if the NFT to be listed approves marketplace
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__MarketplaceNotApproved();
        }
        // Update the Data Structures
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable notListed(nftAddress, tokenId) nonReentrant {
        //get the item user wants to purchase
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        // revert if less amount is paid than listed amount
        if (msg.value < listedItem.price) {
            revert NftMarketplace__InsufficientTransfer(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        // update lockedValue of seller
        s_lockedValue[listedItem.seller] =
            s_lockedValue[listedItem.seller] +
            msg.value;
        // as nft has been been sold remove that from data structure
        delete (s_listings[nftAddress][tokenId]);
        // now transfer the NFT to the purchaser account
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller, // from
            msg.sender, // to
            tokenId //specifies which nft to tranfer
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelItem(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        notListed(nftAddress, tokenId)
    {
        //remove the listing from the marketplace
        delete (s_listings[nftAddress][tokenId]);
        emit ItemRemoved(msg.sender, nftAddress, tokenId);
    }

    function updateItem(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawHoldings() external {
        // get locked Value of the seller
        uint256 lockedValue = s_lockedValue[msg.sender];
        if (lockedValue <= 0) {
            revert NftMarketplace__NoHoldings();
        }
        // set locked value to 0 before transferring (for security)
        s_lockedValue[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: lockedValue}("");
        if (!success) {
            revert NftMarketplace__TransferFailed();
        }
    }

    // GETTER FUNCTIONS

    //get a listing by tokenId
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    // get holdings of seller
    function getHolding(address seller) external view returns (uint256) {
        return s_lockedValue[seller];
    }
}
