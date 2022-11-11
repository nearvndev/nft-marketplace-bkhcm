import { Contract } from "./contract";
import { restoreOwners } from "./internal";
import { JsonToken, NFTContractMetadata, Token } from "./metadata";

export function internalTotalSupply({contract}: {contract: Contract}): number {
    return contract.tokenMetadataById.length;
}

export function internalSupplyForOwner({contract, accountId}: {contract: Contract, accountId: string}): number {
    let tokens = restoreOwners(contract.tokensPerOwner.get(accountId));
    if (tokens == null) {
        return 0
    };

    return tokens.length;
}

export function internalNftToken({contract, tokenId}: {contract: Contract, tokenId: string}): JsonToken {
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        return null;
    }

    let metadata = contract.tokenMetadataById.get(tokenId) as NFTContractMetadata;

    return new JsonToken ({
        tokenId,
        ownerId: token.owner_id,
        metadata
    })
}

export function internalNftTokens({contract, fromIndex, limit}: { contract: Contract, fromIndex?: string, limit?: number }) : JsonToken[] {
    let tokens = [];
    let start = fromIndex ? parseInt(fromIndex) : 0;
    let max = limit ? limit : 50;
    let keys = contract.tokenMetadataById.toArray();
    for (let i = start; i < keys.length && i < start + max; i++) {
        let jsonToken = internalNftToken({contract, tokenId: keys[i][0]});

        tokens.push(jsonToken);
    }

    return tokens;
}

export function internalNftTokensForOwner({contract, accountId, fromIndex, limit}: {contract: Contract, accountId: string, fromIndex?: string, limit?: number}): JsonToken[] {
    let tokens = [];
    let start = fromIndex ? parseInt(fromIndex) : 0;
    let max = limit ? limit : 50;

    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));
    if (tokenSet == null) return [];

    let keys = tokenSet.toArray();

    for(let i = start; i < max; i++) {
        if(i >= keys.length) {
            break;
        }
        let token = internalNftToken({contract, tokenId: keys[i]});
        tokens.push(token);
    }
    return tokens;
}