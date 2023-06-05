import { BytesLike, JsonRpcProvider, ethers } from "ethers";
import {
    getPublicKey,
    getEthereumAddress,
    requestKmsSignature,
    determineCorrectV,
} from "./utils";

export interface AwsKmsSignerCredentials {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    region: string;
    keyId: string;
}

export class AwsKmsSigner extends ethers.AbstractSigner {
    kmsCredentials: AwsKmsSignerCredentials;

    ethereumAddress?: string;

    constructor(
        kmsCredentials: AwsKmsSignerCredentials,
        provider?: ethers.Provider
    ) {
        super(provider);
        this.kmsCredentials = kmsCredentials;
    }

    async getAddress(): Promise<string> {
        if (this.ethereumAddress === undefined) {
            const key = await getPublicKey(this.kmsCredentials);
            const publicKey = key.PublicKey;

            if (!publicKey) {
                throw new Error(`Could not get Public Key from KMS.`);
            }

            this.ethereumAddress = getEthereumAddress(publicKey);
        }
        return Promise.resolve(this.ethereumAddress);
    }

    async _signDigest(digestString: string): Promise<string> {
        const digestBuffer = Buffer.from(ethers.getBytes(digestString));
        const sig = await requestKmsSignature(
            digestBuffer,
            this.kmsCredentials
        );
        const ethAddr = await this.getAddress();
        const { v } = determineCorrectV(digestBuffer, sig.r, sig.s, ethAddr);
        return ethers.Signature.from({
            v,
            r: `0x${sig.r.toString("hex")}`,
            s: `0x${sig.s.toString("hex")}`,
        }).serialized;
    }

    async signMessage(message: BytesLike): Promise<string> {
        return this._signDigest(ethers.hashMessage(message));
    }

    async signTransaction(
        transaction: ethers.TransactionRequest
    ): Promise<string> {
        const unsignedTx = await ethers.resolveProperties(transaction);
        const unsignedSerializedTx = ethers.Transaction.from({
            ...unsignedTx,
            from: unsignedTx.from?.toString(),
            to: unsignedTx.to?.toString(),
        }).unsignedSerialized;
        const transactionSignature = await this._signDigest(
            ethers.keccak256(unsignedSerializedTx)
        );
        return ethers.Transaction.from({
            ...unsignedTx,
            from: unsignedTx.from?.toString(),
            to: unsignedTx.to?.toString(),
            signature: transactionSignature,
        }).serialized;
    }

    connect(provider: JsonRpcProvider): AwsKmsSigner {
        return new AwsKmsSigner(this.kmsCredentials, provider);
    }

    connectByRpcUrl(rpcUrl: string) {
        return new AwsKmsSigner(
            this.kmsCredentials,
            new JsonRpcProvider(rpcUrl)
        );
    }

    signTypedData(
        domain: ethers.TypedDataDomain,
        types: Record<string, ethers.TypedDataField[]>,
        value: Record<string, any>
    ): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
