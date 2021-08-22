import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import axios from 'axios'
import { useWeb3React } from '@web3-react/core'
import { Card, Divider, Header, Icon, Image } from 'semantic-ui-react'

import { nftaddress, nftmarketaddress } from '../../config'

import NFT from '../../abis/NFT'
import Market from '../../abis/NFTMarket'

export default function CreatorDashboard() {
  const {library, account} = useWeb3React();
  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  useEffect(() => {
    loadNFTs()
  }, [library, account]);

  async function loadNFTs() {
    if (library) {
      const signer = library.getSigner()

      const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, library)
      const data = await marketContract.fetchItemsCreated()

      const items = await Promise.all(data.map(async i => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId)
        const meta = await axios.get(tokenUri)
        let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          sold: i.sold,
          image: meta.data.image,
          description: meta.data.description,
          name: meta.data.name,
        };
        return item
      }))
      /* create a filtered array of items that have been sold */
      const soldItems = items.filter(i => i.sold);
      setSold(soldItems);
      setNfts(items);
      setLoadingState('loaded')
    }
  }


  return (


  <div>
    <Divider horizontal>
      <Header as='h4'>
        <Icon name='bar chart'/>
        Items Created
      </Header>
    </Divider>

    <Card.Group doubling itemsPerRow={3} stackable>
      {nfts.map((nft, i) => (


      <Card key={nft.name}>
        <Image src={nft.image} className="img"/>

        <Card.Content>
          <Card.Header>{nft.name}</Card.Header>
          <Card.Meta>Price - {nft.price} ETH</Card.Meta>
          <Card.Description>{nft.description}</Card.Description>
        </Card.Content>

        <Card.Content extra>
        </Card.Content>
      </Card>
      ))}
    </Card.Group>

    <Divider horizontal>
      <Header as='h4'>
        <Icon name='bar chart'/>
        Items Sold
      </Header>
    </Divider>


    <div className="px-4">
      {
        Boolean(sold.length) && (
        <Card.Group doubling itemsPerRow={3} stackable>
          {sold.map((nft, i) => (


          <Card key={nft.name}>
            <Image src={nft.image} className="img"/>

            <Card.Content>
              <Card.Header>{nft.name}</Card.Header>
              <Card.Meta>Price - {nft.price} ETH</Card.Meta>
              <Card.Description>{nft.description}</Card.Description>
            </Card.Content>

            <Card.Content extra>
            </Card.Content>
          </Card>
          ))}
        </Card.Group>
        )
      }
    </div>
  </div>
  )
}
