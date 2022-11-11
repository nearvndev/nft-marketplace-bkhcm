import { UnorderedSet } from "near-sdk-js";
import { Contract } from "./contract";

export function restoreOwners(collection) {
    if (collection == null) {
        return null;
    }
    return UnorderedSet.deserialize(collection as UnorderedSet);
}

export function internalAddTokenToOwner({contract, accountId, tokenId}: {contract: Contract, accountId: string, tokenId: string}) {
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));

    if (tokenSet = null) {
        tokenSet = new UnorderedSet("tokensPerOwner-"+accountId);
    }

    tokenSet.set(tokenId);

    // Insert to owner
    contract.tokensPerOwner.set(accountId, tokenSet);
}