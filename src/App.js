import {Web3ReactProvider} from '@web3-react/core';
import {Web3Provider} from '@ethersproject/providers';

import StickyLayout from './components/Headers';
import Content from './components/Contents';
import Footer from "./components/Footer";
import {Tab} from "semantic-ui-react";

import NFTDAppIndex from "./components/NFTMarket"
import Home from "./components/NFTMarket/home";
import MyAssets from "./components/NFTMarket/assets"
import CreatorDashboard from "./components/NFTMarket/creator-dashboard"

import './App.css';

const getLibrary = (provider) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
};

const panes = [
  {menuItem: 'Home', render: () => <Tab.Pane><Home/></Tab.Pane>},
  {menuItem: 'Creator Dashboard', render: () => <Tab.Pane><CreatorDashboard/></Tab.Pane>},
  {menuItem: 'Digital Assets', render: () => <Tab.Pane><MyAssets/></Tab.Pane>},
];

function App() {
  return (
  <Web3ReactProvider getLibrary={getLibrary}>
    <div className="App">
      <StickyLayout/>
      <Content>
        <NFTDAppIndex/>
        <Tab menu={{fluid: true, vertical: true, tabular: true}} grid={{paneWidth: 14, tabWidth: 2}}
             renderActiveOnly={true} panes={panes}/>
      </Content>
      <Footer/>
    </div>
  </Web3ReactProvider>
  );
}

export default App;
