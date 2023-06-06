import { BytesLike, ContractFactory, InterfaceAbi, JsonRpcProvider } from "ethers";
import { LegacySigner } from "./legacy_signer";
import { AwsKmsSignerCredentials } from "./types";

export class LegacyDeployer extends LegacySigner {

    constructor(
        kmsCredentials: AwsKmsSignerCredentials,
        chainId: bigint,
        rpcUrl: string
    ) {
        super(kmsCredentials, chainId, rpcUrl);
    }

    public async manualDeploy(abi: InterfaceAbi, bytecode: BytesLike, args: any[]) {
        const provider = new JsonRpcProvider(this.rpcUrl);
        const factory = new ContractFactory(abi, bytecode, provider);

        const deployTransaction = await factory.getDeployTransaction(...args);
        const estimatedFee = await provider.estimateGas({
            ...deployTransaction,
            type: this.transactionType
        });

        return await this.sendTransaction({
            ...deployTransaction,
            gasLimit: estimatedFee
        });
    }

    public async deployContract(abi: InterfaceAbi, bytecode: BytesLike, args: any[]) {
        const factory = new ContractFactory(abi, bytecode, this.signer);
        return await factory.deploy(...args, {
            type: this.transactionType 
        });
    }
}
