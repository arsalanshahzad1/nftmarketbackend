import express from 'express';
import {signUp,logIn,returnKeys}  from '../controllers/user.controller';
import { checkToken } from '../middlewares/tokenMiddleware';
const userRouter = express.Router();
console.log(typeof signUp); // should be "function"

userRouter.post('/signUp',signUp);
userRouter.post('/logIn',logIn);
userRouter.get('/getKeys',checkToken,returnKeys)
export default userRouter;
