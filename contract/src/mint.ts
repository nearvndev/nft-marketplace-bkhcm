import { assert, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from "./contract";
import { internalAddTokenToOwner } from "./internal";
import { Token, TokenMetadata } from "./metadata";

export function internalMintNFT({
    contract, 
    tokenId, 
    metadata, 
    receiverId
}: {
    contract: Contract, 
    tokenId: string, 
    metadata: TokenMetadata, 
    receiverId: string
}): void {
    let token = new Token({
        ownerId: receiverId
    });

    assert(!contract.tokensById.containsKey(tokenId), "Token already exists");

    // Insert token
    contract.tokensById.set(tokenId, token);

    // Add token owner
    internalAddTokenToOwner({contract, accountId: receiverId, tokenId});

    // insert token id and metadata
    contract.tokenMetadataById.set(tokenId, metadata);

    // NFT Mint events
    let nftMintLog = {
        standard: NFT_STANDARD_NAME,
        version: NFT_METADATA_SPEC,
        event: "nft_mint",
        data: [
            {
                owner_id: token.owner_id,
                token_ids: [tokenId]
            }
        ]
    }

    near.log(`EVENT_JSON:${JSON.stringify(nftMintLog)}`);
}