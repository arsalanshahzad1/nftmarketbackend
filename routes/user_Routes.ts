import express from 'express';
import {signUp,logIn,returnKeys}  from '../controllers/user.controller';
import { checkToken ,requireAnyRole, requireRole} from '../middlewares/tokenMiddleware';
import { Role } from '../types/userTypes';
const userRouter = express.Router();
console.log(typeof signUp); // should be "function"

userRouter.post('/signUp',signUp);
userRouter.post('/logIn',logIn);
userRouter.get('/getKeys',checkToken,requireRole(Role.user),returnKeys)
export default userRouter;
