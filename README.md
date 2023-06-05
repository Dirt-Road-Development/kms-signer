# KMS Signer

An Ethereum based signed that derivces addresses and signs transactions using AWS KMS.

Table of Contents
---
- [Use KMS Signer](#use-kms-signer)
    - [Installation](#installation)
    - [Setup on AWS](#setup-on-aws)
        - [Creating the KMS Key](#creating-the-kms-key)
        - [Accessing the Key](#accessing-the-key)
    - [Usage](#usage)
- [Contributing](#contributing)
    - [Development Guide](#development-guide)
        - [Clone the GitHub Repo](#clone-the-github-repo)
        - [Install Dependencies](#install-dependencies)
        - [Creating a Branch](#creating-a-branch)
        - [Pushing Changes](#pushing-changes)
        - [Making a PR](#making-a-pull-request)
- [License](#license)
- [Reconitions of Software](#installation)

## Use KMS Signer

The following will walk you through using the KMS Signer in your application.

### Installation

Install the NPM Package by running the following in your terminal

```shell
npm add @dirtroad/kms-signer
```

### Setup on AWS

The package is currently setup to use AWS Key Management Service to handle the keys associated with a given signer. If you do not have an AWS account, you will need one. Additionally, while the actual amount can vary, visit the pricing page for KMS and other AWS services to understand possible costs associated with using this package in any environment.

Start by logging into AWS and then follow the directions below:

### Creating the KMS Key
1. Search for KMS in the Search Bar
2. Select **CREATE KEY**
3. For the Key type select **Asymmetric**
4. For the Key usage select **Sign and Verify**
5. For the Key spec select the last option -- **ECC_SECG_P256K1**
6. If you plan to use this key during develompent, then you can proceed to the next step. If using in production and you want to replicate the key across multiple regions, click Advanced Options and then select **Multi-Region key**
7. Fill in the labels according to your project and add tags as you see fit
8. If you already have IAM Roles setup, you can assgin Key Administrative Permissions or Key Usage Permissions there. If not, proceed to the review step and continue with this guide.

### Accessing the Key

In order to properly access the recently creating key, copy the ARN from the main screen and head over to IAM in the AWS Console.

1. Create a Group
2. Create a User -- reminder to save the credentials for usage
3. Add the User to the Group
4. Create a Policy. The policy should be for KMS, and allow the policy inheritor to -- **Sign** and ** GetPublicKey**.
5. For resources, you can now copy in the ARN and it will mean the policy only works for the specific key creating in the previous step.
6. Add the Policy to the Group (recommended by AWS) or to the User

After the steps above, you should now be able to seed in the AccessKeyId and the SecretAccessKey from the created IAM user and use the KeyId from the KMS key to access and sign transactions.

## Contributing

To contribute to this repository, fork and clone the repo from [GitHub](https://github.com/Dirt-Road-Development/kms-signer) and follow the development guide below.

### Development Guide

#### Clone the Github Repo
```shell
git clone git@github.com/Dirt-Road-Development/kms-signer && cd kms-signer
```

#### Install Dependencies
```shell
npm install
```

#### Creating a Branch

Branches should follow the naming conventions seen here:

| Contribution Type | Branch Prefix |
| ----------------- | ------------- |
| Bug Fix           | bug/          |
| Hot Fix           | hotfix/       |
| Feature           | feature/      |
| Documentation     | docs/         |
| Tests             | tests/        |
|

Check out a GitHub branch by running the following command:

```shell
git checkout -b feature/this-is-a-new-feature
```

#### Pushing Changes
When in active development on a branch you should actively push changes up to your own GitHub repo (fork).

### Making a Pull Request
Once your code is ready to be reviewed, create a Pull Request into the main Dirt Road Development main branch and request **TheGreatAxios** to review the PR.

Please add accompanying tests if possible. NOTE -- This repo currently does not have any tests.

## License

This codebase is released under the MIT License. See the [License](./LICENSE) here. The KMS Signer and code is WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

## Recognition of Software

The following repository is only possible thanks to a couple of amazing authors:

[Rumble Fish Blockchain Development](https://github.com/rumblefishdev) for the follwoing repositories:

- https://github.com/rumblefishdev/hardhat-kms-signer
- https://github.com/rumblefishdev/eth-kms-signer

[RJ Chow](https://github.com/rjchow) for the follwowing repositories:
- https://github.com/rjchow/ethers-aws-kms-signer