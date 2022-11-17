import React, { useEffect, useState} from "react";
import { PageHeader, Card, Button } from "antd";
import { utils } from "near-api-js";
import { ShoppingCartOutlined } from "@ant-design/icons";
const { Meta } = Card;

export default function Market({isSignedIn, nftMarketplace, wallet}) {
    const [sales, setSales] = useState([]);

    async function fetchSales() {
        let data = await nftMarketplace.getSales();
        setSales(data);
        console.log("Sales: ", data);
    }

    async function handleBuyNFT(item) {
        if (isSignedIn) {
            await nftMarketplace.buy(item.sale_id, item.price);
        } else {
            wallet.signIn()
        }
    }

    useEffect(() => {
        fetchSales()
    }, [])

    return (
        <div className="site-layout-content">
            <PageHeader
                className="site-page-header"
                title="Market"
            />

            <div style={{padding: 30, display: "flex", flexWrap: "wrap"}}>
                {
                    sales.map( item => {
                        return (
                            <Card
                                key={item.sale_id}
                                hoverable
                                style={{ width: 240, marginRight: 15, marginBottom: 15 }}
                                cover={<img style={{height: 300, width: "100%", objectFit: "contain"}} alt="Media NFT" src={item.token.metadata.media} />}
                                actions={[
                                    <Button onClick={() => handleBuyNFT(item)} icon={<ShoppingCartOutlined />}> Buy </Button>
                                ]}
                            >
                                <h1>{utils.format.formatNearAmount(item.price) + " NEAR"}</h1>
                                <Meta title={item.token.metadata.title} description={item.owner_id} />
                            </Card>
                        )
                    })
                }
            </div>
        </div>
    )
}