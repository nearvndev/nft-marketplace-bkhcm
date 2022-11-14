import { JsonToken } from "./metadata";

export class Sale {
    owner_id: string;
    token_id: string;
    price: string;

    constructor({owner_id, token_id, price}: {owner_id: string, token_id: string, price: string}) {
        this.owner_id = owner_id;
        this.token_id = token_id;
        this.price = price;
    }
}

export class JsonSale {
    sale_id: string;
    owner_id: string;
    price: string;
    token: JsonToken;

    constructor({sale_id, owner_id, price, token}: {sale_id: string, owner_id: string, price: string, token: JsonToken}) {
        this.sale_id = sale_id;
        this.owner_id = owner_id;
        this.price = price;
        this.token = token;
    }
}