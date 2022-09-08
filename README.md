# NFT Tutorial - NFT Marketplace

Build an NFT marketplace from 0. How to compile, deploy, and call smart contract

# 0. Project Introduction

NFT Marketplace Project Screenshot, Introductions, etc.

\0. Project Introduction

# NFT Marketplace Introduction

![img](https://avatars.githubusercontent.com/u/88427645?s=200&v=4)

Using Starter Kits to build DAPP

An Polygon Starter Kit Tutorial containing React, @web3-react, Infura.

[Developer Docs](https://docs.matic.network/docs/develop/getting-started) - [Tutorial](https://polygon-tutorial.solidstake.net/shelves/tutorial)

## Metaverse Marketplace

> Refer: https://github.com/dabit3/polygon-ethereum-nextjs-marketplace

##### Screenshots：

<img src="https://polygon-tutorial.solidstake.net/uploads/images/gallery/2021-08/IsitvzraB04CaBxc-create-nft.png">

<img src="https://polygon-tutorial.solidstake.net/uploads/images/gallery/2021-08/XiWzeReRDuQIYki1-metaverse.png">

##### URL：

[Polygon-Academy nft-tutorial](https://github.com/Polygon-Academy/nft-tutorial.git)

# 1. Environment Setup

Setup ganache、truffle、infura、IPFS web3

1. Environment Setup

# Setup New Project using Starter Kit

```
npx create-react-app metaverse --template polygon-starter-kit
cd metaverse
npm run start 
```

<img src="https://cdn.rawgit.com/facebook/create-react-app/27b42ac/screencast.svg">

1. Environment Setup

# Create Ganache Workspace、Setup truffle

<img src="https://polygon-tutorial.solidstake.net/uploads/images/gallery/2021-08/MUhHFynBDJYosX0W-ganache-workshop.png">

##### Setting

Modify `truffle-config.js` in `workshop` as `metaverse/truffle-config.js`, which is created in the previous tutorial section.

Set `chainId = 1337`、`portNumber = 8545` in `SERVE`.

##### Create`.env` file , setup truffle

Once you start the program, there will be a `eth` wallet address generated, export your private key

```
vim .env 

# truffle-config
MNEMONIC="{Ganache Mnemonic Or PrivateKey}"
POLYGON_RPC="https://rpc-mainnet.matic.network"
POLYGON_MUMBAI_RPC="https://rpc-mumbai.maticvigil.com"

# infrua config is used for Contract Read/Write
INFURA_ID= "{Your Infura ID}"
```

> Infura ID is created at Infura.io, you will need to create your own Infura RPC on their website.

# 2. Code your Smart Contracts

Code your NFT Marketplace Smart Contracts, Mainly compose of NFT Creation, Showcase, and Sell

\2. Code your Smart Contracts

# NFT.sol

#### NFT ERC721

Create `NFT.sol` under `src/contracts`

```solidity
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/* Create Contract NFT, inherits ERC721URIStorage, Generate ERC721 URI Storage */
contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address contractAddress;

    constructor(address marketplaceAddress) ERC721("Metaverse", "METT") {
    /* Construct the contract, initialize CreateAddress as marketplaceAddress */
        contractAddress = marketplaceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint) {
    /* calls internal increment function, generate new tokenId as indexId */
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
		
    /* Mint NFT with current tokenId for contract caller, set tokenURI, and make it public */
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }
}
```

##### Contract Call Process

```
1. Create Contract NFT, inherits ERC721URIStorage, Generate ERC721 URI Storage
2. Construct the contract, initialize CreateAddress as marketplaceAddress
3. calls internal increment function, generate new tokenId as indexId
4. Mint NFT with current tokenId for contract caller, set tokenURI, and make it public
```

\2. Code your Smart Contracts

# NFTMarket.sol

##### NFT marketplace

Create `NFTMarket.sol` under `src/contracts`

```solidity
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    /*  
    Definitions MarketItem
    @param: itemId 
    @param: ntfContract NFT ERC721 URI Storage deployed on ERC721URIStorage
    @param: seller  Address of Seller
    @param: owner Address of Owner
    @param: price Price of the item
    @param: sold  Sold or not, boolean
    */
    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;
    
     /* Listing NFT to the Marketplace */
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant { 
    
    	  
    	 /* Check if listingPrice is provided, this revenue will go to Marketplace Owner*/
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

	  	/* create new itermId，tokenId */
        _itemIds.increment();
        uint256 itemId = _itemIds.current();


	 	/* fill in MarkItem information, and set the NFT URI, seller address, price */
        idToMarketItem[itemId] =  MarketItem(
        itemId,
        nftContract,
        tokenId,
        payable(msg.sender),
    payable(address(0)),
        price,
        false
        );

		/* change the NFT ownership from owner to MarketAddress */
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }


	/* sellContract　createMarketSale */
    function createMarketSale(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant {
     	/* check if buyer has provided paied enough balance */
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

		/* Transfer sold value to seller */
        idToMarketItem[itemId].seller.transfer(msg.value);
        
       	/* Transfer token to new owner *.
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        
        /* Transfer Listing Fee to MarketPlace Owner */
        payable(owner).transfer(listingPrice);
    }
```

##### Contract Call Process

```
1. Create Contract, Set Contract owner as listingPrice receiver

2. Listing Contract ： 
	① Check if seller has provided listingPrice
	② Create new itermId，tokenId
	③ fill in MarkItem information, and set the NFT URI, seller address, price
	④ change the NFT ownership from owner to MarketAddress
	
3. Sell Contract :
	① check if buyer has provided paied enough balance
	② Transfer sold value to seller
	③ Transfer token to new owner
	④ Transfer Listing Fee to MarketPlace Owner
```

# 3. Compile & Deploy Contract

Compile & Deploy Smart Contract using truffle

\3. Compile & Deploy Contract

# Scripts for Compiling Smart Contract

##### Compile Smart Contract （Smart Contract）

Compile contracts under `migrations` folder

```javascript
# 2_deploy_contract.js 

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
```

\3. Compile & Deploy Contract

# Compile and Deploy Using truffle

Use `truffle` to Compile

```bash
truffle migrate --network development --reset 
```

> --network  to set network as development
>
> --reset Recompile and redeploy will change the original smart contract address

Outputs：

```bash
Compiling your contracts...
===========================
✔ Fetching solc version list from solc-bin. Attempt #1
> Everything is up to date, there is nothing to compile.



Starting migrations...
======================
> Network name:    'development'
> Network id:      1337
> Block gas limit: 6721975 (0x6691b7)


1_initial_migration.js
======================

   Replacing 'Migrations'
   ----------------------
   > transaction hash:    0x9c82efbf1d5f388920a142a5b81329475ddf096726f6bb23f4743eb83193c83a
   > Blocks: 0            Seconds: 0
   > contract address:    0x55dFBFF0f754b9850c1BbA86937EEA28686d423A
   > block number:        12
   > block timestamp:     1629619133
   > account:             0x636b2260Ea9261a4a5Be9AafB397FDb4644E7849
   > balance:             79.91878172
   > gas used:            248854 (0x3cc16)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00497708 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.00497708 ETH


2_depoly_contract.js
====================

   Replacing 'NFTMarket'
   ---------------------
   > transaction hash:    0xfe6c0d9c55961c64531e7f8c3c945ff6635c1ae651941291d70c1ed1d0c6ea8a
   > Blocks: 0            Seconds: 0
   > contract address:    0xB89D4fb583c73F8476bdcd61BB64403AA59444c7
   > block number:        14
   > block timestamp:     1629619133
   > account:             0x636b2260Ea9261a4a5Be9AafB397FDb4644E7849
   > balance:             79.88835536
   > gas used:            1478805 (0x169095)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.0295761 ETH


   Replacing 'NFT'
   ---------------
   > transaction hash:    0xbf2efb65f3b19f2e877521596445f4aef1479cfe6b848a807932d185cd812304
   > Blocks: 0            Seconds: 0
   > contract address:    0x8FED174E8B6028b0737884719Cd35549CFB0f3Ca
   > block number:        15
   > block timestamp:     1629619133
   > account:             0x636b2260Ea9261a4a5Be9AafB397FDb4644E7849
   > balance:             79.83771858
   > gas used:            2531839 (0x26a1ff)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.05063678 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.08021288 ETH


Summary
=======
> Total deployments:   3
> Final cost:          0.08518996 ETH
```

# 4. Calling Smart Contract from Frontend (ABI)

Examples of how to call Contract ABI using IPFS、ethers.js、@web3-react

\4. Calling Smart Contract from Frontend (ABI)

# Call Contract ABI

##### Dependencies Requirements

```bash
npm install ipfs-http-client ethers 
```

or

```bash
npm install 
```

##### Upload `Image` to `IPFS`

```javascript
import { create as ipfsHttpClient } from 'ipfs-http-client'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

async function onChange(e) {
    const file = e.target.files[0];
    try {
      const added = await client.add(
      file,
      {
        progress: (prog) => console.log(`received: ${prog}`)
      }
      );
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }
```

##### Listing NFT

```javascript
import {useWeb3React} from '@web3-react/core'

const {library, account} = useWeb3React();


/* ERC721 Token Create */
async function createSale(url) {
    /* next, create the item */
    if (library) {
      let signer = library.getSigner();
      let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
      let transaction = await contract.createToken(url);
      let tx = await transaction.wait();
      let event = tx.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();

      const price = ethers.utils.parseUnits(formInput.price, 'ether');

      /* then list the item for sale on the marketplace */
      contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer);
      let listingPrice = await contract.getListingPrice();
      listingPrice = listingPrice.toString();

      transaction = await contract.createMarketItem(nftaddress, tokenId, price, {value: listingPrice});
      await transaction.wait();
    }
  }
```

##### Purchase NFT

```javascript
import {useWeb3React} from '@web3-react/core'

const {library, account} = useWeb3React();

async function buyNft(nft) {
    if (library) {
      const signer = library.getSigner();
      const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);

      const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
      const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
        value: price
      })
      await transaction.wait();
      loadNFTs()
    }
  }
```

