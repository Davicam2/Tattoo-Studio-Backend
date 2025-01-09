import express, { request } from 'express';
import { verifyLogin } from '../controllers';

const userRouter = express.Router();

userRouter.get('/verify', verifyLogin);



export default userRouter;