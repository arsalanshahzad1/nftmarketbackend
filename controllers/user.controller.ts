import { UserModel } from "../models/user.model";
import { Request, Response } from "express";
import { User_SignUp_Dto, Login_Dto } from "../types/userTypes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
require("dotenv").config();

const signUp = async (req: Request<{}, {}, User_SignUp_Dto>, res: Response) => {
  try {
    const { userId, email, name, password } = req.body;
    const User = await UserModel.findOne({ email, name });
    if (User)
      return void res
        .status(200)
        .json({ message: "user with same mail already exist" });
    const newUser = new UserModel({ userId, email, name, password });

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
    console.log(`the user password in the db are ${userPassword}`)
    const verify = bcrypt.compareSync(password, userPassword);
    User.tokenVersion += 1;
    User.save()
    if (!verify) {
      return void res.status(401).json({ message: "Incorrect password" });
    }
    const userId = User._id;
    const token = jwt.sign(
      { userId, email, password, tokenVersion: User.tokenVersion },
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
    return void res
      .status(400)
      .json({
        message: "error occured during key fetch",
        error: error.message,
      });
  }
};

export { signUp, logIn, returnKeys };
