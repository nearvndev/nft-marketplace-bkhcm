import { assert, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from "./contract";
import { internalAddTokenToOwner, internalRemoveTokenFromOwner } from "./internal";
import { Token } from "./metadata";

export function assertOneYocto() {
    // 1 NEAR = 10^24 yoctoNEAR
    assert(near.attachedDeposit().toString() === "1", "Requires attached deposit of exactly 1 yoctoNEAR");
}

/**
 * 1. Validate data
 * 2. Xoá owner hiện tại NFT
 * 3. Thêm owner mới cho NFT
 */
export function internalNftTransfer({
    contract,
    receiverId,
    tokenId,
    memo
}: {
    contract: Contract,
    receiverId: string,
    tokenId: string,
    memo: string
}) {
    let token = contract.tokensById.get(tokenId) as Token;
    let senderId = near.predecessorAccountId();

    if (token == null) {
        near.panicUtf8("Not found token");
    }

    assert(senderId == token.owner_id, "Unauthorized");
    assert(receiverId != token.owner_id, "The token owner and the receiver should be different");

    internalRemoveTokenFromOwner({contract, accountId: token.owner_id, tokenId});
    internalAddTokenToOwner({contract, accountId: receiverId, tokenId});

    let newToken = new Token({
        ownerId: receiverId
    });
    contract.tokensById.set(tokenId, newToken);
    if (memo != null) {
        near.log(`Memo: ${memo}`);
    }
    let nftTransferLog = {
        standard: NFT_STANDARD_NAME,
        version: NFT_METADATA_SPEC,
        event: "nft_transfer",
        data: [
            {
                authorized_id: senderId,
                old_owner_id: token.owner_id,
                new_owner_id: receiverId,
                token_ids: [tokenId],
                memo
            }
        ]
    }

    // Log the serialized json
    near.log(`EVENT_JSON:${JSON.stringify(nftTransferLog)}`);
    return token;
}

export function internalOfferNftTransfer({
    contract,
    receiverId,
    senderId,
    tokenId,
    memo
}: {
    contract: Contract,
    receiverId: string,
    senderId: string,
    tokenId: string,
    memo: string
}) {
    let token = contract.tokensById.get(tokenId) as Token;

    if (token == null) {
        near.panicUtf8("Not found token");
    }

    assert(senderId == token.owner_id, "Unauthorized");
    assert(receiverId != token.owner_id, "The token owner and the receiver should be different");

    internalRemoveTokenFromOwner({contract, accountId: token.owner_id, tokenId});
    internalAddTokenToOwner({contract, accountId: receiverId, tokenId});

    let newToken = new Token({
        ownerId: receiverId
    });
    contract.tokensById.set(tokenId, newToken);
    if (memo != null) {
        near.log(`Memo: ${memo}`);
    }
    let nftTransferLog = {
        standard: NFT_STANDARD_NAME,
        version: NFT_METADATA_SPEC,
        event: "nft_transfer",
        data: [
            {
                authorized_id: senderId,
                old_owner_id: token.owner_id,
                new_owner_id: receiverId,
                token_ids: [tokenId],
                memo
            }
        ]
    }

    // Log the serialized json
    near.log(`EVENT_JSON:${JSON.stringify(nftTransferLog)}`);
    return token;
}