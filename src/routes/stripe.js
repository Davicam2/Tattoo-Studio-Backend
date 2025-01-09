import express, { request } from 'express';

import { makeOrder } from '../controllers';

const stripeRouter = express.Router();

stripeRouter.post('/charge', makeOrder);



export default stripeRouter;