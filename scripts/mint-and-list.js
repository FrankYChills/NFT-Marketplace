const { ethers } = require("hardhat");

const LIST_PRICE = ethers.utils.parseEther("0.02");
async function mintAndList() {
  console.log("Getting Marketplace Contract ...");
  const nftMarketplace = await ethers.getContract("MarketplaceContract");
  console.log("Got Marketplace Contract");
  console.log("Getting NFT Contract ...");
  const basicNft = await ethers.getContract("NFTContract");
  console.log("Got NFT Contract");
  console.log("Minting NFT ...");
  const mintTx = await basicNft.mintNft();
  // we have to wait for atleast 1 block confirmations to get response back
  const mintTxReceipt = await mintTx.wait(1);
  const tokenId = mintTxReceipt.events[0].args.tokenId;
  console.log(
    `Approving Marketplace to list the nft of tokenid: ${tokenId.toString()} ...`
  );
  const approveTx = await basicNft.approve(nftMarketplace.address, tokenId);
  await approveTx.wait(1);
  console.log("Approved");
  console.log("Listing Nft in Marketplace ...");
  const tx = await nftMarketplace.listItem(
    basicNft.address,
    tokenId,
    LIST_PRICE
  );
  await tx.wait(1);
  console.log("NFT Listed");
}

mintAndList()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
