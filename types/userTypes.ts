// types/User.ts
import { Types } from 'mongoose';


 enum Role {
  user = "user",
  admin = "admin"
}

 interface IUser {
  userId: string;
  name: string;
  email: string;
  password: string;
  privateKey: string;
  publicKey: string;
  tokenVersion:number;
  usdt_Approved:boolean;
  role:Role
}


//  interface INft {
//   id: string;
//   uri: string;
//   shares: number;
//   owners: Types.ObjectId[];   // preferred if referencing MongoDB user docs
// }

 interface User_SignUp_Dto {
    userId:string,
    email : string,
    name:string,
    password:string,
    role?:Role
}

interface Login_Dto {
  password:string,
  email:string
}

interface Buy_Jtc_Dto{
  usdt_Amount:number;
}
export {IUser,User_SignUp_Dto,Login_Dto,Role,Buy_Jtc_Dto}
