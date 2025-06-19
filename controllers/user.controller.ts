import { UserModel } from "../models/user.model";
import { Request, Response } from "express";
import {
  User_SignUp_Dto,
  Login_Dto,
  Role,
  Buy_Jtc_Dto,
} from "../types/userTypes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import {
  approve_Usdt,
  buy_Jtc_Meta_Tx,
  estimate_Usdt_Approval,
  send_Bnb,
} from "../meta-Txns/buy_Jtc";
import { ethers } from "ethers";
require("dotenv").config();

const signUp = async (
  req: Request<{}, {}, User_SignUp_Dto & { adminSecret?: string }>,
  res: Response
) => {
  try {
    const { userId, email, name, password, role, adminSecret } = req.body;
    const User = await UserModel.findOne({ email, name });
    if (User)
      return void res
        .status(200)
        .json({ message: "user with same mail already exist" });

    let assignedRole: Role = Role.user;

    if (role === Role.admin) {
      if (adminSecret === process.env.ADMIN_SIGN_UP_SECRET) {
        assignedRole = Role.admin;
      } else {
        return void res.status(403).json({ message: "Invalid admin secret" });
      }
    }

    const newUser = new UserModel({
      userId,
      email,
      name,
      password,
      role: assignedRole,
    });

    await newUser.save();
    return void res.status(200).json({ message: "signUp succesFull" });
  } catch (e: any) {
    return void res
      .status(400)
      .json({ message: "error occured during signUp", error: e.message });
  }
};

const logIn = async (req: Request<{}, {}, Login_Dto>, res: Response) => {
  const { password, email } = req.body;
  console.log(`trying to logIn`);
  try {
    const User = await UserModel.findOne({ email });
    if (!User) return void res.status(200).json({ message: "user not found" });
    const userPassword = User.password;
    console.log(`the user password in the db are ${userPassword}`);
    const verify = bcrypt.compareSync(password, userPassword);
    User.tokenVersion += 1;
    User.save();
    if (!verify) {
      return void res.status(401).json({ message: "Incorrect password" });
    }
    const userId = User._id;
    const token = jwt.sign(
      {
        userId,
        email,
        password,
        tokenVersion: User.tokenVersion,
        role: User.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30m" }
    );
    return void res
      .status(200)
      .json({ message: "user logged in SuccesFully", token });
  } catch (error) {
    return void res.status(400).json({ message: "error during logIn" });
  }
};

const returnKeys = async (req: Request, res: Response) => {
  const UserId = req.user!.userId;
  try {
    const User = await UserModel.findById(UserId);
    if (!User) return void res.status(200).json({ message: "user not found" });
    const publicKey = User.publicKey;
    return void res
      .status(200)
      .json({ message: "public key fetched", key: publicKey });
  } catch (error: any) {
    return void res.status(400).json({
      message: "error occured during key fetch",
      error: error.message,
    });
  }
};

const approve_Usdt_Token = async (req: Request, res: Response) => {
  const UserId = req.user!.userId;
  try {
    const User = await UserModel.findById(UserId);
    console.log(1);
    if (!User) return void res.status(200).json({ message: "user not found" });
    console.log(2);

    const userPrivateKey = User.privateKey;
    console.log(3);

    const bytes = CryptoJS.AES.decrypt(
      userPrivateKey ?? "".toString(),
      User.password ?? "".toString()
    );
    const encryptedKey = bytes.toString(CryptoJS.enc.Utf8);
    console.log(`the decrypted Private Key is ${encryptedKey}`);
    const requiredBnb = await estimate_Usdt_Approval(
      encryptedKey,
      process.env.JTC_TOKEN_ADDRESS!
    );
    const sending_Bnb = await send_Bnb(
      User.publicKey,
      ethers.parseEther(requiredBnb!),
      process.env.USER_PRIVATE_KEY!
    );
    const approve_Usdt_token = await approve_Usdt(
      encryptedKey,
      process.env.JTC_TOKEN_ADDRESS!
    );
    console.log(`bnb sent to the use`);
    User.usdt_Approved = true;
    await User.save();
    return void res.status(200).json({
      message: "key got succesFully",
      key: encryptedKey,
      requiredBnb,
      funding_tx: sending_Bnb,
      approve_tx: approve_Usdt_token,
    });
  } catch (error: any) {
    console.error("USDT Approval Error:", error);
    return void res.status(400).json({
      message: "USDT approval process failed",
      error: error.message || error.toString(),
    });
  }
};

const buy_Jtc_Token = async (
  req: Request<{}, {}, Buy_Jtc_Dto>,
  res: Response
) => {
  const UserId = req.user!.userId;
  const User = await UserModel.findById(UserId);
  const { usdt_Amount } = req.body;

  if (!User) return void res.status(200).json({ message: "user not found" });

  try {
    const scaledAmount = ethers.parseUnits(usdt_Amount.toString(), 18); // BigInt
    const userPrivateKey = User.privateKey;
    console.log(3);

    const bytes = CryptoJS.AES.decrypt(
      userPrivateKey ?? "".toString(),
      User.password ?? "".toString()
    );
    const encryptedKey = bytes.toString(CryptoJS.enc.Utf8);
    const jtcBuying = await buy_Jtc_Meta_Tx(encryptedKey, scaledAmount);
    return void res.status(200).json({message:"trx submitted for buying the Jtc",hash:jtcBuying})
  } catch (error: any) {
     console.error("JTC purchase Error:", error);
    return void res.status(400).json({
      message: "JTC purchase process failed",
      error: error.message || error.toString(),
    });
  }
};
export { signUp, logIn, returnKeys, approve_Usdt_Token ,buy_Jtc_Token };
