import React, {useEffect, useState} from 'react'
import {Header, Icon, Segment, Card, Button, Image} from 'semantic-ui-react'
import {useWeb3React} from '@web3-react/core'
import {ethers} from "ethers";
import axios from 'axios'

import NFT from '../../abis/NFT'
import Market from '../../abis/NFTMarket'
import {nftaddress, nftmarketaddress} from "../../config";

import "./nft.css"

export default function Home() {
  const {library, account} = useWeb3React();
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');


  useEffect(() => {
    loadNFTs()
  }, [library, account]);


  async function loadNFTs() {
    if (library) {
      const provider = await library;
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
      const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider);
      const data = await marketContract.fetchMarketItems();


      const items = await Promise.all(data.map(async i => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        }
        return item
      }))
      setNfts(items)
      setLoadingState('loaded')
    }
  }

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

  if (loadingState === "not-loaded") return (
  <Segment placeholder>
    <Header icon>
      <Icon name='pdf file outline'/>
      The Contract has not deployment on this blockchain network
    </Header>
  </Segment>
  );


  // if (loadingState === 'loaded' && !nfts.length) return (
  // <Segment placeholder>
  //   <Header icon>
  //     <Icon name='pdf file outline'/>
  //     No documents are listed for this customer.
  //   </Header>
  // </Segment>
  // );


  return (
  <Card.Group doubling itemsPerRow={3} stackable>
    {nfts.map((nft, i) => (


    <Card key={nft.name}>
      <Image src={nft.image} className="img"/>

      <Card.Content>
        <Card.Header>{nft.name}</Card.Header>
        <Card.Meta>{nft.price} ETH</Card.Meta>
        <Card.Description>{nft.description}</Card.Description>
      </Card.Content>

      <Card.Content extra>
        <Button style={{float: "right"}} primary onClick={() => buyNft(nft)}>
          Buy
        </Button>
      </Card.Content>
    </Card>
    ))}
  </Card.Group>
  )
}

