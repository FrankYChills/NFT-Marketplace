const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  let args = [];

  console.log("Deploying BasicNFT Contract ...");
  const basicNft = await deploy("NFTContract", {
    contract: "BasicNFT",
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations,
  });
  console.log("BasicNFT Contract deployed");
  console.log("---------------------------------------------");

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying on etherscan ....");
    await verify(basicNft.address, args);
    log("----------Verified on Etherscan ------------");
    log("---------------------------------------------");
  }
};
module.exports.tags = ["all", "basicnft"];
