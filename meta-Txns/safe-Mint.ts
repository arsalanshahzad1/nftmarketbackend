import { ethers } from "ethers";
// import { createRelayerClient } from '@openzeppelin/defender-sdk';
// import { getEthersSigner } from '@openzeppelin/defender-sdk-relay-client';
import {
    DefenderRelayProvider,
    DefenderRelaySigner,
} from "@openzeppelin/defender-relay-client/lib/ethers";

import { forwarderAbi } from "../Abis/Abi";
import {nftAbi } from "../Abis/Abi";
import { Address } from "@openzeppelin/defender-relay-client/lib/relayer";

// ------------------------- CONFIG -------------------------

const USER_PRIVATE_KEY =
    "0xf774451e023b3dfddf3b41af5341172a7e623a407d04bd5a1cb77cd4c4400f59"; // user wallet private key (signer)
const CONTRACT_ADDRESS = "0x03c0319BE2ddfBbDE2e108Af780E84c5884DB146";
const FORWARDER_ADDRESS = "0xefF4585DF36A6F634Ce479088bc6Aba234D40cBC";
const DEFENDER_API_KEY = "9Wf1QHTWEoFWb7QmDp7rm9y165KdfLkw";
const DEFENDER_API_SECRET =
    "3mUfQZb9SvmwUacQujDG1xCuAcnQX7Tu93SsW6515GETmh71h9zjpQSbs8D7H6pr";
const to = "0x0E8C3348A9C6CCC3eF9e8F2649EA2490056893f0";
const hash = "bafybeig6nwoykem4u34pax52gewusx5hbynkv7hlccyeoyk2gh7aok7hou";
const CHAIN_ID = 97; // e.g., BSC Testnet chain ID

// Target function and arguments — replace with your actual function call
const FUNCTION_NAME = "safeMint";
const FUNCTION_ARGS = [to, hash];

// ------------------------ MAIN LOGIC ------------------------

async function main() {
    // 1. Setup provider for the target network (example: BSC testnet)
    const provider = new ethers.JsonRpcProvider(
        "https://bsc-testnet.infura.io/v3/e71d39d9d58b4736ae7dcba730bc1f18"
    );

    // 2. Initialize user wallet (signer) for signing meta-tx request
    const userWallet = new ethers.Wallet(USER_PRIVATE_KEY, provider);

    // 3. Prepare contracts interface and forwarder contract instance (read-only)
    const forwarder = new ethers.Contract(FORWARDER_ADDRESS, forwarderAbi, provider);
    const contractInterface = new ethers.Interface(nftAbi);

    // 4. Encode the function data for the meta-transaction
    const data = contractInterface.encodeFunctionData(
        FUNCTION_NAME,
        FUNCTION_ARGS
    );

    // 5. Get current nonce for the user from the forwarder
      const nonce = await forwarder.nonces(userWallet.address);
    // const nonce = await provider.getTransactionCount(userWallet.address);
    console.log(`the nonce for the users wallet is ${nonce}`);

    // 6. Prepare the ForwardRequest object to sign
        const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

        const deadline = Math.floor((Date.now() + FIVE_MINUTES_IN_MS) / 1000); // Unix timestamp in seconds
    const gasLimit = await provider.getFeeData();
    console.log(`the fee data from the provider is ${JSON.stringify(gasLimit,null,2)}`)
    const request = {
        from: userWallet.address,
        to: CONTRACT_ADDRESS,
        value: 0,
        gas: 5_000_000,
        nonce: Number(nonce),
        deadline,
        data,
    };

    // 7. Prepare EIP-712 domain and types per MinimalForwarder standard
    const domain = {
        name: "ERC2771Forwarder",
        version: "1",
        chainId: CHAIN_ID,
        verifyingContract: FORWARDER_ADDRESS,
    };

    const types = {
        ForwardRequest: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint48" }, // add deadline here
            { name: "data", type: "bytes" },
        ],
    };

    // 8. Sign the typed data (EIP-712) using user's private key
    const signature = await userWallet.signTypedData(domain, types, request);

    // 9. Create Defender relayer client and signer
    const credentials = {
        apiKey: DEFENDER_API_KEY,
        apiSecret: DEFENDER_API_SECRET,
    };

    const relayProvider = new DefenderRelayProvider(credentials);
    const relaySigner = new DefenderRelaySigner(credentials, relayProvider, {
        speed: "fast",
    });

    // 10. Connect forwarder contract with relayer signer
    const forwarderWithSigner = new ethers.Contract(
        FORWARDER_ADDRESS,
        forwarderAbi,
        relaySigner as unknown as ethers.ContractRunner
    );

    // 11. Execute the meta-transaction via forwarder contract
    console.log("Sending meta-transaction...");

const tx = await forwarderWithSigner.execute({
  from: request.from,
  to: request.to,
  value: request.value,
  gas: request.gas,
  deadline: request.deadline,
  data: request.data,
  signature: signature,
}
,
  {
    gasLimit: 3000000 // or whatever gas limit number you want to set
  });

    console.log(`Meta-tx submitted. Tx hash: ${tx.hash}`);

    // 12. Wait for transaction confirmation
    const receipt = await provider.waitForTransaction(tx.hash);
    console.log("Meta-transaction confirmed on-chain!",receipt?.hash);
    console.log(`the reciept for this is the ${JSON.stringify(receipt,null,2)}`)
}

main().catch((error) => {
    console.error("Error in meta-tx flow:", error);
    process.exit(1);
});


const listNft = async(signerPrivateKey:Address,tokenId:number,price:number,decimals:number)=>{
    

}
