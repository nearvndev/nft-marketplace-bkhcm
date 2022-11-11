import { NearBindgen, near, call, view, LookupMap, UnorderedMap, initialize } from 'near-sdk-js';
import { internalNftToken, internalNftTokens, internalNftTokensForOwner, internalSupplyForOwner, internalTotalSupply } from './enummeration';
import { JsonToken, NFTContractMetadata, TokenMetadata } from './metadata';
import { internalMintNFT } from './mint';

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

@NearBindgen({})
export class Contract {
    owner_id: string;
    tokensPerOwner: LookupMap = new LookupMap("tokensPerOwner"); // {accountId, Set<TokenID>}
    tokensById: LookupMap = new LookupMap("tokensById"); // {tokenId, Token}
    tokenMetadataById: UnorderedMap = new UnorderedMap("tokenMetadataById"); // {tokenId, TokenMetadata}
    metadata: NFTContractMetadata = new NFTContractMetadata(
        {
            spec: "nft-1.0.0",
            name: "BKHCM Tutorial Contract",
            symbol: "BKHCM-NFT"
        });

    @initialize({privateFunction: true})
    init({owner_id}: {owner_id: string}) {
        this.owner_id = owner_id;
    }

    /**
     * Mint NFT
     */
    @call({payableFunction: true})
    nft_mint({token_id, metadata, receiver_id}: { token_id: string, metadata: TokenMetadata, receiver_id: string}) {
        internalMintNFT({contract: this, tokenId: token_id, metadata, receiverId: receiver_id});
    }

    @call({payableFunction: true})
    nft_transfer({receiver_id, token_id, approval_id, memo}: {
        receiver_id: string,
        token_id: string,
        approval_id: number | null,
        memo: string | null
    }) {

    }

    @call({payableFunction: true})
    nft_transfer_call({receiver_id, token_id, approval_id, memo, msg}: {
        receiver_id: string,
        token_id: string,
        approval_id: number|null,
        memo: string|null,
        msg: string,
    }): void {

    }

    @call({privateFunction: true})
    nft_resolve_transfer({owner_id, receiver_id, token_id, approved_account_ids}: {
        owner_id: string,
        receiver_id: string,
        token_id: string,
        approved_account_ids: null|Record<string, number>
    }): void {}

    @view({})
    nft_total_supply(): string {
        return internalTotalSupply({contract: this}).toString();
    }

    @view({})
    nft_supply_for_owner({account_id}: {account_id: string}): string {
        return internalSupplyForOwner({contract: this, accountId: account_id}).toString();
    }
    
    @view({})
    nft_tokens({from_index, limit}: { from_index: string | null, limit: number }): JsonToken[] {
        return internalNftTokens({contract: this, fromIndex: from_index, limit});
    }

    @view({})
    nft_token({token_id}: {token_id: string}) : JsonToken {
        return internalNftToken({contract: this, tokenId: token_id});
    }

    @view({})
    nft_tokens_for_owner({account_id, from_index, limit}: { account_id: string, from_index: string, limit: number }): JsonToken[] {
        return internalNftTokensForOwner({contract: this, accountId: account_id, fromIndex: from_index, limit});
    }

    @view({})
    nft_metadata(): NFTContractMetadata {
        return this.metadata;
    }
}