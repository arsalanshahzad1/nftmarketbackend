import mongoose, { Schema, Document, Model } from 'mongoose';
import {IUser,Role} from '../types/userTypes'
import bcrypt from 'bcrypt'
import CryptoJS from 'crypto-js'
import { Wallet} from 'ethers'
export interface IUserDocument extends IUser, Document {}

const UserSchema: Schema = new Schema<IUserDocument>({
  userId: { type: String },
  name: { type: String },
  email: { type: String },
  password: { type: String },
  privateKey: { type: String ,default: null },
  publicKey: { type: String,default: null },
  tokenVersion: { type: Number, default: 0 },
  usdt_Approved:{type:Boolean,default:false},
    role: {
    type: String,
    enum: Object.values(Role), // This ensures only valid enum strings
    default: Role.user,        //  Set default to string enum
  },
});


UserSchema.pre<IUserDocument>('save', function (next) {
  console.log(`Pre-save hook triggered for user: ${this.email}`);

  if (!this.isModified('password')) return next();

  try {
    console.log(`Hashing password...`);
    this.password = bcrypt.hashSync(this.password, 10);
    console.log(`Password hashed successfully`);
     if (!this.privateKey || !this.publicKey) {
      const wallet = Wallet.createRandom();
      const encryptedKey = CryptoJS.AES.encrypt(
        wallet.privateKey.toString(),
        this.password ?? ""
      ).toString();
      this.privateKey = encryptedKey;
      this.publicKey = wallet.address;
      console.log(`New wallet generated for user.`);
    } else {
      console.log(`Wallet already exists, skipping generation.`);
    }
    next();
  } catch (error: any) {
    console.error(`Error hashing password:`, error);
    next(error);
  }
});



// The model is typed
export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);