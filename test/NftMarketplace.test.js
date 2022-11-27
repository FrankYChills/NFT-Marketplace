const { assert, expect } = require("chai");
const { network, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NftMarketplace unit test", function () {
      let deployer, user, nftMarketplace;
      let TOKEN_ID = 0;
      let PRICE = ethers.utils.parseEther("0.05");
      beforeEach(async () => {
        let accounts = await ethers.getSigners();
        deployer = accounts[0];
        // user account
        user = accounts[1];
        await deployments.fixture(["all"]);
        // get marketplace contract
        nftMarketplace = await ethers.getContract("MarketplaceContract");
        // connect to nftMarketplace contract via deployer (account[0]) account
        nftMarketplace = nftMarketplace.connect(deployer);
        // get the nft contracy
        basicNft = await ethers.getContract("NFTContract");
        // connect to nft contract via deployer(accounts[0])
        basicNft = basicNft.connect(deployer);
        // mint an nft
        await basicNft.mintNft();
        //as this is a test definately the token id will be 0 of the minted nft
        // approve nftMarketplace to list this nft (basically approve nft by using token id (which nft))
        await basicNft.approve(nftMarketplace.address, TOKEN_ID);
      });
      describe("list NFT", function () {
        it("emits an event after listing an NFT", async () => {
          expect(
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.emit("ItemListed");
        });
        it("shouldnt list same nft twice", async () => {
          // list the same NFT twice
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NftAlreadyListed()");
        });
        it("only owner of the NFT should be able list to marketplace", async () => {
          // nft minted by accounts[1] try to list it by accounts[1]
          // connect to marketplace by accounts[1]
          // give access to accounts[1] to use nft of token id 0
          // msg.sender to marketplace is user but owner of nft is accounts[0]
          nftMarketplace = nftMarketplace.connect(user);

          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotOwner()");
        });
        it("Marketplace should be approved by NFT to use particular NFT(TOKEN ID)", async () => {
          // change access
          // msg.sender to marketplace is accounts[0] but approved user for nft is null address

          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID);
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__MarketplaceNotApproved()");
        });
        it("should get the listing", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert.equal(listing.price.toString(), PRICE.toString());
          assert.equal(listing.seller.toString(), deployer.address);
        });
      });
      describe("Cancel listing", function () {
        it("reverts if there is no listing", async () => {
          await expect(
            nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftNotListed");
        });
        it("reverts if non-owner of NFT tries to cancel item", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          nftMarketplace = await nftMarketplace.connect(user);
          await expect(
            nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NotOwner");
        });
        it("emits an event when listing is removed", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
          ).to.emit("ItemRemoved");
        });
      });
    });
