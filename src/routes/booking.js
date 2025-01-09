import express, { request } from 'express';
//import * as multer from 'multer';
const multer = require('multer');
const upload = multer();
import { 
    neoTest, 
    requestABooking, 
    getBookedDates, 
    getBookings, 
    accept, 
    reject, 
    updateBookingDate, 
    getBooking,  
    getSecureBookings,
    getBookingImages,
    cancel,
    updateProperty
} from '../controllers'



const bookingRouter = express.Router();

bookingRouter.post('/request', upload.any(), requestABooking);
bookingRouter.get('/dates', getBookedDates);
bookingRouter.get('/neoTest', neoTest);
bookingRouter.get('/bookings', getBookings);
bookingRouter.get('/booking', getBooking);
bookingRouter.put('/accept', accept);
bookingRouter.delete('/reject', reject);
bookingRouter.put('/book-date', updateBookingDate);
bookingRouter.get('/image-links', getBookingImages);
bookingRouter.put('/cancel', cancel);
bookingRouter.put('/update', updateProperty)

//PII restricted routes
bookingRouter.get('/secure-bookings', getSecureBookings);


// indexRouter.get('/', (req, res) =>
//   res.status(200).json({ message: testEnvironmentVariable })
// );

export default bookingRouter;