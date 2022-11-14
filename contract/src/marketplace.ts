import { Contract } from "./contract";
import { assert, near, UnorderedSet } from "near-sdk-js";
import { JsonToken, Token } from "./metadata";
import { JsonSale, Sale } from "./sale";
import { restoreOwners } from "./internal";
import { internalNftTransfer, internalOfferNftTransfer } from "./nft_core";

export function internalAddSale({
    contract,
    token_id,
    price
}: {
    contract: Contract,
    token_id: string,
    price: string
}) {
    let senderId = near.predecessorAccountId();
    let token = contract.tokensById.get(token_id) as Token;
    if (token == null) {
        near.panicUtf8("Not found token");
    }
    assert(senderId == token.owner_id, "Unauthorized");

    let sale = new Sale({
        owner_id: senderId,
        token_id,
        price
    });

    contract.nextSaleId++;
    let saleId = contract.nextSaleId.toString();
    contract.sales.set(saleId, sale);
    
    internalAddSaleByOwner({contract, accountId: senderId, saleId});
}

export function internalAddSaleByOwner({
    contract,
    accountId,
    saleId
}: {
    contract: Contract,
    accountId: string,
    saleId: string
}) {
    let saleSet = restoreOwners(contract.salesByOwnerId.get(accountId));
    if (saleSet == null) {
        saleSet = new UnorderedSet("saleByOwner-" + accountId);
    }
    saleSet.set(saleId);
    contract.salesByOwnerId.set(accountId, saleSet);
}

export function internalRemoveSale({contract, sale_id}: {contract: Contract, sale_id: string}) {
    let sale = contract.sales.remove(sale_id) as Sale;
    if (sale == null) {
        near.panicUtf8("No sale");
    }

    let byOwnerId = restoreOwners(contract.salesByOwnerId.get(sale.owner_id));
    if (byOwnerId == null) {
        near.panicUtf8("No sale by owner");
    }
    byOwnerId.remove(sale_id);
    if (byOwnerId.isEmpty()) {
        contract.salesByOwnerId.remove(sale.owner_id);
    } else {
        contract.salesByOwnerId.set(sale.owner_id, byOwnerId);
    }

    return sale;
}

export function internalGetSale({contract, sale_id}: {contract: Contract, sale_id: string}): JsonSale {
    let sale = contract.sales.get(sale_id) as Sale;
    let tokenMetadata = contract.tokenMetadataById.get(sale.token_id);

    let token = new JsonToken({
        tokenId: sale.token_id,
        ownerId: sale.owner_id,
        metadata: tokenMetadata
    });
    let jsonSale = new JsonSale({
        sale_id,
        owner_id: sale.owner_id,
        price: sale.price,
        token
    });

    return jsonSale;
}

export function internalGetSales({contract}: {contract: Contract}): JsonSale[] {
    let sales = [];
    let keys = contract.sales.toArray();
    for (let i = 0; i < keys.length; i++) {
        let jsonSale = internalGetSale({contract, sale_id: keys[i][0]});
        sales.push(jsonSale);
    }

    return sales;
}

/**
 * 1. Validate data
 * 2. Transfer NFT cho nguoi mua
 * 3. Transfer token cho ng ban
 * 4. Remove sale
 */
export function internalBuyNft({contract, sale_id}: {contract: Contract, sale_id: string}) {
    let sale = contract.sales.get(sale_id) as Sale;
    if (sale == null) {
        near.panicUtf8("Sale not found");
    }
    let deposit = near.attachedDeposit().valueOf();
    assert(deposit > 0, "deposit must be greater than 0");
    let price = BigInt(sale.price);
    assert(deposit >= price, "deposit must ne greater than or equal to price");

    let buyerId = near.predecessorAccountId();
    assert(buyerId != sale.owner_id, "you can't offer on your sale");

    // 2. transfer nft to buyer
    internalOfferNftTransfer({contract, receiverId: buyerId, senderId: sale.owner_id, tokenId: sale.token_id, memo: "Buy from marketplace"});

    // 3. transfer NEAR to owner
    const promise = near.promiseBatchCreate(sale.owner_id);
    // Action transfer NEAR
    near.promiseBatchActionTransfer(promise, price);

    // 4. remove sale
    internalRemoveSale({contract, sale_id});

}