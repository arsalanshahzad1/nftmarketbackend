import express from 'express';
import {signUp,logIn,returnKeys,approve_Usdt_Token, buy_Jtc_Token}  from '../controllers/user.controller';
import { checkToken ,requireAnyRole, requireRole, requireUsdtNotApproved} from '../middlewares/tokenMiddleware';
import { Role } from '../types/userTypes';
const userRouter = express.Router();
console.log(typeof signUp); // should be "function"

userRouter.post('/signUp',signUp);
userRouter.post('/logIn',logIn);
userRouter.get('/getKeys',checkToken,requireRole(Role.user),returnKeys)
userRouter.post('/approve_Usdt',checkToken,requireUsdtNotApproved,approve_Usdt_Token)
userRouter.post('/buyJtc',checkToken,buy_Jtc_Token)
export default userRouter;
