import express from 'express'
import dotenv from 'dotenv';
import {connect} from '../utils/connect_Db'
import cookieParser from 'cookie-parser'
import userRouter from '../routes/user_Routes'
dotenv.config();


const app  = express();
const port = process.env.PORT;
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json()); // Parses JSON bodies

app.get('/c', (req, res) => {  
  res.send('Server is running!');
});

app.use('/api/users',userRouter)

console.log(`the port is ${port}`)
app.listen(port,()=>{
  connect();
    console.log(`database connected`)
})



