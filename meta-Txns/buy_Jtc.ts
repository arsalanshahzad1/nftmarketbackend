import { ethers, MaxUint256 } from "ethers";

import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "@openzeppelin/defender-relay-client/lib/ethers";

import { forwarderAbi, jtc_Abi, nftAbi, usdt_Abi } from "../Abis/Abi"; // Standard ERC20 ABI
import dotenv from "dotenv";
import { Address } from "@openzeppelin/defender-relay-client/lib/relayer";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.BSC_TESTNET_RPC);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY!, provider);

// note to mySelf
//first complete the whole flow on the test network then test on the test Network after that only go for mainnet testing;
// Constants
const USDT_ADDRESS = process.env.USDT_OWN_Address!; // BSC Mainnet USDT
const SPENDER_ADDRESS = "0x0E8C3348A9C6CCC3eF9e8F2649EA2490056893f0"; // Contract to approve USDT for
const USDT_AMOUNT = MaxUint256.toString(); // Example: 10 USDT

const estimate_Usdt_Approval = async (
  userPrivateKey: Address,
  spender: Address
) => {
  try {
    const userWallet = new ethers.Wallet(userPrivateKey, provider);

    const usdt = new ethers.Contract(USDT_ADDRESS, usdt_Abi, provider).connect(
      userWallet
    );

    // Use Ethers v6 style for populateTransaction
    const approveTx = await usdt
      .getFunction("approve")
      .populateTransaction(spender, USDT_AMOUNT);

    // Estimate gas
    const gasEstimate = await provider.estimateGas({
      ...approveTx,
      from: userWallet.address,
    });

    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice!;
    const bufferMultiplier = BigInt(1025);
    const bufferDivisor = BigInt(1000);
    const rawBNBNeeded = gasEstimate * gasPrice;
    const estimatedBNBNeeded =
      (rawBNBNeeded * bufferMultiplier) / bufferDivisor;

    console.log(
      `the raw amount for the user's required for approval is this ${estimatedBNBNeeded}`
    );
    console.log(
      `Raw gas cost: ${ethers.formatEther(
        rawBNBNeeded
      )} and in raw ${rawBNBNeeded}`
    );
    console.log(
      `Gas with 2.5% buffer: ${ethers.formatEther(estimatedBNBNeeded)}`
    );
    return ethers.formatEther(estimatedBNBNeeded);
  } catch (err) {
    console.error("Error in buyJtc:", err);
    throw new Error(
      `estimate_Usdt_Approval failed: ${(err as any).reason || err}`
    );
  }
};

const send_Bnb = async (
  recipientAddress: string,
  bnbAmount: bigint,
  senderPrivateKey: string
) => {
  try {
    const senderWallet = new ethers.Wallet(senderPrivateKey, provider);

    const tx = await senderWallet.sendTransaction({
      to: recipientAddress,
      value: bnbAmount,
    });

    console.log(
      `Sent ${ethers.formatEther(bnbAmount)} BNB to ${recipientAddress}`
    );
    console.log(`Transaction hash: ${tx.hash}`);

    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error("Error sending BNB:", err);
    throw new Error(`send_Bnb failed: ${(err as any).reason || err}`);
  }
};

const approve_Usdt = async (userPrivateKey: string, spenderAddress: string) => {
  try {
    const userSigner = new ethers.Wallet(userPrivateKey, provider);

    const usdt = new ethers.Contract(
      process.env.USDT_OWN_Address!,
      usdt_Abi,
      userSigner
    );

    const tx = await usdt.approve(spenderAddress, MaxUint256);
    console.log(`Approval TX sent: ${tx.hash}`);

    await tx.wait();
    console.log("Approval confirmed!");
    return tx.hash;
  } catch (err) {
    console.error("Error approving USDT:", err);
    throw new Error(`approve_Usdt failed: ${(err as any).reason || err}`);
  }
};

const buy_Jtc_Meta_Tx = async (userPrivateKey: string, usdt_Amount:  bigint | string) => {
  const FUNCTION_NAME = "BuyJtcToken";
  const FUNCTION_ARGS = [usdt_Amount];
  const userWallet = new ethers.Wallet(userPrivateKey, provider);
  const forwarder = new ethers.Contract(
    process.env.FORWARDER_ADDRESS!,
    forwarderAbi,
    provider
  );
  const contractInterface = new ethers.Interface(jtc_Abi);
  const data = contractInterface.encodeFunctionData(
    FUNCTION_NAME,
    FUNCTION_ARGS
  );
  const nonce = await forwarder.nonces(userWallet.address);
  // const nonce = await provider.getTransactionCount(userWallet.address);
  console.log(`the nonce for the users wallet is ${nonce}`);

  // 6. Prepare the ForwardRequest object to sign
  const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

  const deadline = Math.floor((Date.now() + FIVE_MINUTES_IN_MS) / 1000); // Unix timestamp in seconds
  const gasLimit = await provider.getFeeData();
  console.log(
    `the fee data from the provider is ${JSON.stringify(gasLimit, null, 2)}`
  );
  const request = {
    from: userWallet.address,
    to: process.env.JTC_TOKEN_ADDRESS,
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
    chainId: process.env.CHAIN_ID,
    verifyingContract: process.env.FORWARDER_ADDRESS!,
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
    apiKey: process.env.DEFENDER_API_KEY!,
    apiSecret: process.env.DEFENDER_API_SECRET!,
  };

  const relayProvider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, relayProvider, {
    speed: "fast",
  });

  // 10. Connect forwarder contract with relayer signer
  const forwarderWithSigner = new ethers.Contract(
    process.env.FORWARDER_ADDRESS!,
    forwarderAbi,
    relaySigner as unknown as ethers.ContractRunner
  );

  // 11. Execute the meta-transaction via forwarder contract
  console.log("Sending meta-transaction...");

  const tx = await forwarderWithSigner.execute(
    {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: request.data,
      signature: signature,
    },
    {
      gasLimit: 3000000, // or whatever gas limit number you want to set
    }
  );

  console.log(`Meta-tx submitted. Tx hash: ${tx.hash}`);

  // 12. Wait for transaction confirmation
  const receipt = await provider.waitForTransaction(tx.hash);
  console.log("Meta-transaction confirmed on-chain!", receipt?.hash);
  console.log(
    `the reciept for this is the ${JSON.stringify(receipt, null, 2)}`
  );
  return receipt;
};

// approveUsdt("0xf774451e023b3dfddf3b41af5341172a7e623a407d04bd5a1cb77cd4c4400f59","0x5bedB1ED9e72DF0f202309EeC5d4b14864335465");

// sendBnb("0xb151c02227e2bc1DDda728B98701BC00cdf3479e",ethers.parseEther("0.000046889"),"0xf774451e023b3dfddf3b41af5341172a7e623a407d04bd5a1cb77cd4c4400f59");

// estimate_Usdt_Approval("0xf774451e023b3dfddf3b41af5341172a7e623a407d04bd5a1cb77cd4c4400f59","0xAC7F3B92E6b92FB0A348cBaCab7914c939a10Dc8");

export { estimate_Usdt_Approval, send_Bnb, approve_Usdt, buy_Jtc_Meta_Tx };
