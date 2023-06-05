import { keccak256, recoverAddress } from "ethers";
import { KMS, SignRequest } from "@aws-sdk/client-kms";
import * as asn1 from "asn1.js";
import BN from "bn.js";
import { AwsKmsSignerCredentials } from "./types";

/* this asn1.js library has some funky things going on */
/* eslint-disable func-names */
const EcdsaSigAsnParse: {
    decode: (asnStringBuffer: Buffer, format: "der") => { r: BN; s: BN };
} = asn1.define("EcdsaSig", function (this: any) {
    // parsing this according to https://tools.ietf.org/html/rfc3279#section-2.2.3
    this.seq().obj(this.key("r").int(), this.key("s").int());
});
const EcdsaPubKey = asn1.define("EcdsaPubKey", function (this: any) {
    // parsing this according to https://tools.ietf.org/html/rfc5480#section-2
    this.seq().obj(
        this.key("algo")
            .seq()
            .obj(this.key("a").objid(), this.key("b").objid()),
        this.key("pubKey").bitstr()
    );
});
/* eslint-enable func-names */

export async function sign(
    digest: Buffer,
    kmsCredentials: AwsKmsSignerCredentials
) {
    const kms = new KMS({
        region: kmsCredentials.region,
        credentials:
            kmsCredentials.accessKeyId && kmsCredentials.secretAccessKey
                ? {
                      accessKeyId: kmsCredentials.accessKeyId,
                      secretAccessKey: kmsCredentials.secretAccessKey,
                  }
                : undefined,
    });
    const params: SignRequest = {
        // key id or 'Alias/<alias>'
        KeyId: kmsCredentials.keyId,
        Message: digest,
        // 'ECDSA_SHA_256' is the one compatible with ECC_SECG_P256K1.
        SigningAlgorithm: "ECDSA_SHA_256",
        MessageType: "DIGEST",
    };
    const res = await kms.sign(params);
    return res;
}

export async function getPublicKey(kmsCredentials: AwsKmsSignerCredentials) {
    const kms = new KMS({
        region: kmsCredentials.region,
        credentials:
            kmsCredentials.accessKeyId && kmsCredentials.secretAccessKey
                ? {
                      accessKeyId: kmsCredentials.accessKeyId,
                      secretAccessKey: kmsCredentials.secretAccessKey,
                  }
                : undefined,
    });
    return await kms.getPublicKey({ KeyId: kmsCredentials.keyId });
}

export function getEthereumAddress(publicKey: Uint8Array): string {
    // The public key is ASN1 encoded in a format according to
    // https://tools.ietf.org/html/rfc5480#section-2
    // I used https://lapo.it/asn1js to figure out how to parse this
    // and defined the schema in the EcdsaPubKey object



    const decodedAsn1Struct = EcdsaPubKey.decode(Buffer.from(publicKey), "der");
    const decodedPublicKey = decodedAsn1Struct.pubKey.data;
    const decodedTrimmedPublicKey = decodedPublicKey.slice(
        1,
        decodedPublicKey.length
    );
    const keccakPublicKey = keccak256(decodedTrimmedPublicKey);
    const bufferKeccakPublicKey = Buffer.from(keccakPublicKey.slice(2), "hex");
    const ethAddress =
        "0x" + bufferKeccakPublicKey.subarray(-20).toString("hex");

    return ethAddress;
}

/**
 * 
 * TODO -> This is broken?
 
 */
export function findEthereumSig(signature: Buffer) {

    const decodedAsn1Struct = EcdsaSigAsnParse.decode(
        signature,
        "der"
    );
    const r: BN = decodedAsn1Struct.r;
    let s: BN = decodedAsn1Struct.s;

    const secp256k1N = new BN(
        "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
        16
    ); // max value on the curve
    const secp256k1halfN = secp256k1N.div(new BN(2)); // half of the curve
    // Because of EIP-2 not all elliptic curve signatures are accepted
    // the value of s needs to be SMALLER than half of the curve
    // i.e. we need to flip s if it's greater than half of the curve
    // if s is less than half of the curve, we're on the "good" side of the curve, we can just return

    if (s.gt(secp256k1halfN)) {
        s = secp256k1N.sub(s);
    }

    return { r, s };
}

export async function requestKmsSignature(
    plaintext: Buffer,
    kmsCredentials: AwsKmsSignerCredentials
) {
    const signature = await sign(plaintext, kmsCredentials);
    if (!signature.Signature) {
        throw new Error(`AWS KMS call failed`);
    }
    return findEthereumSig(Buffer.from(signature.Signature));
}

function recoverPubKeyFromSig(msg: Buffer, r: BN, s: BN, v: number) {
    return recoverAddress(`0x${msg.toString("hex")}`, {
        r: `0x${r.toString("hex")}`,
        s: `0x${s.toString("hex")}`,
        v,
    });
}

export function determineCorrectV(
    msg: Buffer,
    r: BN,
    s: BN,
    expectedEthAddr: string
) {
    // This is the wrapper function to find the right v value
    // There are two matching signatues on the elliptic curve
    // we need to find the one that matches to our public key
    // it can be v = 27 or v = 28
    let v = 27;
    let pubKey = recoverPubKeyFromSig(msg, r, s, v);
    if (pubKey.toLowerCase() !== expectedEthAddr.toLowerCase()) {
        // if the pub key for v = 27 does not match
        // it has to be v = 28
        v = 28;
        pubKey = recoverPubKeyFromSig(msg, r, s, v);
    }

    return { pubKey, v };
}
