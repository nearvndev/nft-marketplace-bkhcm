## PTIT NFT
### Mint NFT
**1. Create NFT contract account**
```
export $NFT_CONTRACT=bkhcm.vbidev.testnet
export $MAIN_ACCOUNT=vbidev.testnet

near create-account $NFT_CONTRACT --masterAccount $MAIN_ACCOUNT --initialBalance 20
```

**2. Build & Deploy contract**

Build contract
```
npm run build:contract
```

Deploy contract
```
near deploy --wasmFile contract/build/contract.wasm --accountId $NFT_CONTRACT --initFunction init --initArgs '{"owner_id": "'$MAIN_CONTRACT'"}'
```

**3. Interact with contract**
Get nft_metdata
```
near view $NFT_CONTRACT nft_metadata
```

Mint your NFTs
```
near call $NFT_CONTRACT nft_mint '{"token_id": "token-1", "metadata": {"title": "My Non Fungible Team Token", "description": "PTIT test my first NFT", "media": "https://bafkreic5i4mlci625akfwlrjrh77hhvlbr5zoqj7b4j5lzwpjrygdrvlja.ipfs.nftstorage.link"}, "receiver_id": "'$MAIN_ACCOUNT'"}' --accountId $MAIN_ACCOUNT --amount 0.1
```

and check Collectibles in NEAR Wallet =)))


## Marketplace
1. Add sale
```
near call $NFT_CONTRACT add_sale '{"token_id": "token-1", "price": "1000000000000000000000000"}' --accountId $MAIN_ACCOUNT --depositYocto 1
```

2. Get sales
```
near view $NFT_CONTRACT get_sales
```

3. Buy NFT
```
near call $NFT_CONTRACT buy '{"sale_id": "3"}' --accountId nearvietnamhub.testnet --deposit 1
```