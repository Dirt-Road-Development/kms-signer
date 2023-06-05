import { TransactionRequest, TransactionResponse } from "ethers";
import { AwsKmsSigner } from "./kms_signer";
import { AwsKmsSignerCredentials } from "./types";

export abstract class BaseSigner {
    
    abstract transactionType: number;

    protected chainId: bigint;
    protected signer: AwsKmsSigner;
    protected rpcUrl: string;

    protected address?: string;
    protected nonce?: number;

    constructor(
        kmsCredentials: AwsKmsSignerCredentials,
        chainId: bigint,
        rpcUrl: string,
        initialize: boolean = true
    ) {
        this.signer = new AwsKmsSigner(kmsCredentials).connectByRpcUrl(rpcUrl);
        this.chainId = chainId;
        this.rpcUrl = rpcUrl;
        if (initialize) this.initialize();
        
    }

    abstract broadcastTransaction(signedTransaction: string) : Promise<TransactionResponse>;
    abstract signTransaction(unsignedTransaction: TransactionRequest): Promise<string>;
    abstract sendTransaction(unsignedTransaction: TransactionRequest) : Promise<TransactionResponse>;
    
    public async initialize() {
        this.address = await this.signer.getAddress();
        this.nonce = await this.signer.getNonce()
    }
}