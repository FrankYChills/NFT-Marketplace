const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  let args = [];

  console.log("Deploying NFTMarketplace Contract ...");
  const nftMarketplace = await deploy("MarketplaceContract", {
    contract: "NftMarketplace",
    from: deployer,
    log: true,
    waitConfirmations: network.config.blockConfirmations,
  });
  console.log("NFTMarketplace Contract deployed");
  log("---------------------------------------------");

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying on etherscan ....");
    await verify(nftMarketplace.address, args);
    log("----------Verified on Etherscan ------------");
    log("---------------------------------------------");
  }
};
module.exports.tags = ["all", "nftmarketplace"];
