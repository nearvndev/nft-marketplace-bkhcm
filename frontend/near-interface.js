import { throws } from "assert";
import {utils} from "near-api-js";

export class NFTMarketplace {
    constructor({contractId, wallet}) {
        this.contractId = contractId;
        this.wallet = wallet;
    }

    async mintNFT(tokenId, metadata, receiverId) {
        return await this.wallet.callMethod({
            contractId: this.contractId,
            method: "nft_mint",
            args: {
                token_id: tokenId,
                metadata,
                receiver_id: receiverId
            },
            deposit: utils.format.parseNearAmount("0.01") // Deposit 0.01 NEAR
        })
    }
    async nftTransfer(receiverId, tokenId, approvalId = 0, memo = "") {
        return await this.wallet.callMethod({
            contractId: this.contractId,
            method: "nft_transfer",
            args: {
                receiver_id: receiverId,
                token_id: tokenId,
                approval_id: approvalId,
                memo
            },
            deposit: 1 // Deposit 1 yoctoNEAR
        })
    }

    async nftToken(tokenId) {
        return await this.wallet.viewMethod({
            contract: this.contractId,
            method: "nft_token",
            args: {
                token_id: tokenId
            }
        })
    }

    async nftTokenForOwner(accountId, fromIndex = "0", limit = 100) {
        console.log("Account: ", accountId);
        return await this.wallet.viewMethod({
            contractId: this.contractId,
            method: "nft_tokens_for_owner",
            args: {
                account_id: accountId,
                from_index: fromIndex,
                limit
            }
        })
    }

    async getSales() {
        return await this.wallet.viewMethod({
            contractId: this.contractId,
            method: "get_sales",
            args: {}
        })
    }
    async buy(saleId, amount) {
        return await this.wallet.callMethod({
            contractId: this.contractId,
            method: "buy",
            args: {
                sale_id: saleId
            },
            deposit: amount
        })
    }
    async addSale(tokenId, price) {
        return await this.wallet.callMethod({
            contractId: this.contractId,
            method: "add_sale",
            args: {
                token_id: tokenId,
                price: utils.format.parseNearAmount(price)
            },
            deposit: 1
        })
    }
}
// ABI