export interface AwsKmsSignerCredentials {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    region: string;
    keyId: string;
}
