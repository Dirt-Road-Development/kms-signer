import {
    JsonRpcProvider,
    TransactionRequest,
    TransactionResponse,
    parseEther,
} from "ethers";
import { BaseSigner } from "./base_signer";
import { AwsKmsSignerCredentials } from "./types";
import { getLogger } from "./logger";

export class LegacySigner extends BaseSigner {
    public transactionType = 0;

    constructor(
        kmsCredentials: AwsKmsSignerCredentials,
        chainId: bigint,
        rpcUrl: string
    ) {
        super(kmsCredentials, chainId, rpcUrl);
    }

    public async broadcastTransaction(
        signedTransaction: string
    ): Promise<TransactionResponse> {
        if (this.signer.provider) {
            return await this.signer.provider.broadcastTransaction(
                signedTransaction
            );
        }

        return new JsonRpcProvider(this.rpcUrl).broadcastTransaction(
            signedTransaction
        );
    }

    public async signTransaction(
        unsignedTransaction: TransactionRequest
    ): Promise<string> {
        return await this.signer.signTransaction({
            ...unsignedTransaction,
            chainId: this.chainId,
            nonce: this.nonce ?? (await this.signer.getNonce()),
            gasPrice:
                unsignedTransaction.gasPrice ??
                (
                    await this.signer.provider?.getFeeData()
                )?.gasPrice ??
                BigInt(100000),
            gasLimit:
                unsignedTransaction.gasLimit ??
                (await this.signer.provider?.estimateGas({
                    ...unsignedTransaction,
                    from: await this.signer.getAddress(),
                    type: this.transactionType,
                })) ??
                BigInt(100000),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            type: this.transactionType,
        });
    }

    public async sendTransaction(
        unsignedTransaction: TransactionRequest
    ): Promise<TransactionResponse> {
        const signedTransaction = await this.signTransaction(
            unsignedTransaction
        );
        return await this.broadcastTransaction(signedTransaction);
    }
}
