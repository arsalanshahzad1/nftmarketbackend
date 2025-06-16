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
  tokenVersion:number
  role:Role
}


 interface INft {
  id: string;
  uri: string;
  shares: number;
  owners: Types.ObjectId[];   // preferred if referencing MongoDB user docs
}

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

export {IUser,INft,User_SignUp_Dto,Login_Dto,Role}
