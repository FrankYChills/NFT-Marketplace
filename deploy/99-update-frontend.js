const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONTEND_ADDRESSES_FILE =
  "../nextjs-nftmarketplace/constants/networkMapping.json";
// we'll have two abis file that we'll create at runtime not beforehand as networkMapping.json file
const FRONTEND_ABIFILE = "../nextjs-nftmarketplace/constants/";
module.exports = async () => {
  if (process.env.UPDATE_FRONTEND) {
    console.log(
      "Updating frontend files with deployed contracts ABIs and Addresses"
    );
    await updateContractAddresses();
    await updateABI();
    console.log(
      "Frontend updated.Please check your constants folder in frontend directory."
    );
  }
};

async function updateContractAddresses() {
  console.log("Getting deployed Marketplace contract ..");
  const chainId = network.config.chainId;
  console.log(`Current chain id : ${chainId}`);
  const marketplace = await ethers.getContract("MarketplaceContract");
  console.log("Got marketplace contract");
  const currentAddress = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf-8")
  );
  if (chainId in currentAddress) {
    //if local chain id is a key already in addresses file but you deployed contract again on same network hence address will be different so push to same chain Id contract
    if (!currentAddress[chainId].includes(marketplace.address)) {
      currentAddress[chainId].push(marketplace.contract);
    }
  } else {
    currentAddress[chainId] = [marketplace.address];
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddress));
  console.log("Marketplace contract address updated successfully");
}

async function updateABI() {
  console.log("Working on updating ABIS ...");
  const marketplace = await ethers.getContract("MarketplaceContract");
  const basicNft = await ethers.getContract("NFTContract");
  console.log("Writing BasicNFT ABI");
  fs.writeFileSync(
    `${FRONTEND_ABIFILE}BasicNft.json`,
    basicNft.interface.format(ethers.utils.FormatTypes.json)
  );
  console.log("Writing NftMarketplace ABI");
  fs.writeFileSync(
    `${FRONTEND_ABIFILE}NftMarketplace.json`,
    marketplace.interface.format(ethers.utils.FormatTypes.json)
  );
  console.log("ABIs were wrote successfully");
}
