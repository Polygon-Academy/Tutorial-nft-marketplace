const fs = require('fs');
const NFT = artifacts.require("NFT");
const NFTMarket = artifacts.require("NFTMarket");

module.exports = async function (deployer, network, accounts) {

  // step1 deploy nftMarket contract
  await deployer.deploy(NFTMarket);
  const nftMarket = await NFTMarket.deployed();

  // step2 deploy nft contract
  await deployer.deploy(NFT, nftMarket.address);
  const nft = await NFT.deployed();

  let config = `
export const nftmarketaddress = "${nftMarket.address}"
export const nftaddress = "${nft.address}"
  `;

  let data = JSON.stringify(config);
  fs.writeFileSync('./src/config.js', JSON.parse(data))

};
