import React, { useEffect, useState } from "react";
import { PageHeader, Card, Button } from "antd";
import { ShoppingCartOutlined, SendOutlined, DollarCircleOutlined  } from "@ant-design/icons";
import ModalMintNFT from "../components/ModalMintNFT";
import { async } from "regenerator-runtime";
import ModalSale from "../components/ModalSale";
const { Meta } = Card;

export default function MyNFT({isSignedIn, nftMarketplace, wallet}) {
    const [nfts, setNfts] = useState([]);
    const [mintVisible, setMintVisible] = useState(false);
    const [saleVisible, setSaleVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    async function fetchNfts() {
        let data = await wallet.viewMethod({
            contractId: process.env.CONTRACT_NAME,
            method: "nft_tokens_for_owner",
            args: {
                account_id: wallet.accountId,
                from_index: "0",
                limit: 100
            }
        });
        setNfts(data);
        console.log("NFTs: ", data);
    }

    function handleSaleToken(item) {
        setCurrentItem(item);
        setSaleVisible(true);
    }

    async function submitOnMint({tokenId, tokenTitle, description, media}) {
        await nftMarketplace.mintNFT(
            tokenId,
            {
                title: tokenTitle,
                description,
                media
            },
            wallet.accountId
        )
    }

    async function submitOnSale(token, price) {
        await nftMarketplace.addSale(
            currentItem.token_id,
            price
        )
    }

    useEffect(() => {
        if (isSignedIn) {
            fetchNfts();
        } else {
            wallet.signIn();
        }
    }, [])


    return (
        <div className="site-layout-content">
            <PageHeader
                className="site-page-header"
                title="My NFTs"
                extra={[
                    <Button onClick={() => {setMintVisible(true)}} key="3">Mint NFT</Button>
                ]}
            />

            <div style={{padding: 30, display: "flex", flexWrap: "wrap"}}>
                {
                    nfts.map(item => {
                        return (
                            <Card
                                key={item.token_id}
                                hoverable
                                style={{ width: 240, marginRight: 15, marginBottom: 15 }}
                                cover={<img style={{height: 300, width: "100%", objectFit: "contain"}} alt="nft-cover" src={item.metadata.media} />}
                                actions={[
                                    <SendOutlined onClick={() => {}} key={"send"}/>,
                                    <DollarCircleOutlined onClick={() => handleSaleToken(item)} key={"sell"} />,
                                ]}
                            >
                                <Meta title={item.metadata.title} description={item.owner_id} />
                            </Card>
                        )
                    })
                }
            </div>
            <ModalMintNFT visible={mintVisible} handleOk={submitOnMint} handleCancel={() => setMintVisible(false)}/>
            <ModalSale visible={saleVisible} handleOk={submitOnSale} handleCancel={() => setSaleVisible(false)}/>
        </div>
    )
}