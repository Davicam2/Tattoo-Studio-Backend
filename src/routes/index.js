import express, { request } from 'express';
import { testEnvironmentVariable } from '../../settings';
import bookingRouter from './booking'
import { requestBooking, availableDates } from '../controllers'

const indexRouter = express.Router();

indexRouter.get('/', (req, res) => res.status(200).json({ message: testEnvironmentVariable }));

export default indexRouter;