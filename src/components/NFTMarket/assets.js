import { ethers } from 'ethers'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useWeb3React } from '@web3-react/core'

import NFT from '../../abis/NFT'
import Market from '../../abis/NFTMarket'
import { nftaddress, nftmarketaddress } from '../../config'
import { Card, Header, Icon, Image, Segment } from 'semantic-ui-react'

import './nft.css'

export default function MyAssets() {
  const {library, account} = useWeb3React();
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs()
  }, [library, account]);

  async function loadNFTs() {
    if (library) {
      const signer = library.getSigner()

      const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, library)
      const data = await marketContract.fetchMyNFTs();

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
          description: meta.data.description,
          name: meta.data.name,
        };
        return item
      }));
      setNfts(items);
      setLoadingState('loaded')
    }
  }

  // if (loadingState === "not-loaded") return (
  // <Segment placeholder>
  //   <Header icon>
  //     <Icon name='pdf file outline'/>
  //     The Contract has not deployment on this blockchain network
  //   </Header>
  // </Segment>
  // );

  if (loadingState === 'loaded' && !nfts.length) return (
  <Segment placeholder>
    <Header icon>
      <Icon name='pdf file outline'/>
      No documents are listed for this customer.
    </Header>
  </Segment>
  );

  return (
  <Card.Group doubling itemsPerRow={3} stackable>
    {nfts.map((nft, i) => (

    <Card key={nft.tokenId}>
      <Image src={nft.image} className="img"/>

      <Card.Content>
        <Card.Header>{nft.price} ETH</Card.Header>
        <Card.Meta>tokenId: 0x{nft.tokenId}</Card.Meta>
        <Card.Description>seller: {nft.seller}</Card.Description>
      </Card.Content>

      <Card.Content extra>
      </Card.Content>

    </Card>
    ))}
  </Card.Group>
  )
}

