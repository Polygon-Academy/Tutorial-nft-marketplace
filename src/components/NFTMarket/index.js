import React from 'react'
import { ethers } from 'ethers'
import { create } from 'ipfs-http-client';
import { Button, Form, Header, Image, Input, Modal } from 'semantic-ui-react'

import './nft.css'
import NFT from '../../abis/NFT'
import NFTMarket from '../../abis/NFTMarket'
import { useWeb3React } from '@web3-react/core'
import { nftaddress, nftmarketaddress } from '../../config'

const auth =
    'Basic ' + Buffer.from(INFURA_IPFS_ID + ':' + INFURA_IPFS_SECRET).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});


const FormNoFile = {
  width: "400px"
};

const FormFile = {
  marginLeft: "10.5em",
  width: "400px"
};


export default function NFTDAppIndex() {
  const {library} = useWeb3React();
  const [open, setOpen] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState(null);
  const [formInput, updateFormInput] = React.useState({price: '', name: '', description: ''});


  function resetFile(){
    setFileUrl(null);
    setOpen(false);
  }

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      const added = await client.add(
      file,
      {
        progress: (prog) => console.log(`received: ${prog}`)
      }
      );
      const url = `{YOUR_DEDICATED_DOMAIN}/ipfs/${added.path}`;
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  async function createMarket() {
    const {name, description, price} = formInput;
    if (!name || !description || !price || !fileUrl) return;

    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    });


    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      createSale(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
    resetFile()
  }

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

  return (
  <Header size="huge" color="grey">Metaverse Marketplace
    <Modal
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    open={open}
    trigger={<Button color='orange' style={{float: "right"}}>Sell Assets</Button>}
    >
      <Modal.Header>Sell Digital Assets</Modal.Header>
      <Modal.Content image>

        {
          !fileUrl && (
          <Input type="file" onChange={onChange}>
          </Input>
          )
        }


        {
          fileUrl && (
          <Image size='large'
                 src={fileUrl}
                 />)
        }
        <Modal.Description>
          <Form style={fileUrl ? FormNoFile : FormFile}>
            <Form.Input fluid label='Assets name' placeholder='Assets name'
                        onChange={e => updateFormInput({...formInput, name: e.target.value})}/>
            <Form.TextArea label='Description' placeholder='Tell us more about your assets...'
                           onChange={e => updateFormInput({...formInput, description: e.target.value})}/>
            <Form.Input fluid label="Value" action={{
              color: 'teal',
              icon: 'cart',
              content: 'ETH',
            }} onChange={e => updateFormInput({...formInput, price: e.target.value})}/>
          </Form>


        </Modal.Description>
      </Modal.Content>


      <Modal.Actions>
        <Button onClick={resetFile}>Cancel</Button>
        <Button onClick={createMarket} positive>
          Ok
        </Button>
      </Modal.Actions>
    </Modal>
  </Header>

  )
}
