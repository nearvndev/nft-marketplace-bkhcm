// React
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NFTMarketplace } from './near-interface';

import { Wallet } from './near-wallet';

// When creating the wallet you can optionally ask to create an access key
// Having the key enables to call non-payable methods without interrupting the user to sign
const wallet = new Wallet({ createAccessKeyFor: process.env.CONTRACT_NAME });
const nftMarketplace = new NFTMarketplace({contractId: process.env.CONTRACT_NAME, wallet});

// Setup on page load
window.onload = async () => {
  const isSignedIn = await wallet.startUp()
 
  ReactDOM.render(
    <BrowserRouter>
      <App isSignedIn={isSignedIn} nftMarketplace={nftMarketplace} wallet={wallet} />
    </BrowserRouter>,
    document.getElementById('root')
  );
}