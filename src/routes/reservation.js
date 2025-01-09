import express, { request } from 'express';

import { createDateReservation, deleteReservation, getReservations } from '../controllers'



const reservationRouter = express.Router();

reservationRouter.post('/reserve', createDateReservation);
reservationRouter.get('/getReservationList', getReservations);
reservationRouter.delete('/removeReservation', deleteReservation);




export default reservationRouter;