import logger from 'morgan';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import indexRouter from './routes/index';
import bookingRouter from './routes/booking';
import reservationRouter from './routes/reservation';
import userRouter from './routes/user';
import emailTemplateRouter from './routes/email-templates'
import bodyParser from 'body-parser';
import stripeRouter from './routes/stripe';
import helmet from 'helmet';

import { appConfig, serverUrl, corsDNS } from '../settings';


global.G_emailTemplateLocation = __dirname + '/email-templates';
// const options = {
//     allowedHeaders: [
//       'Origin',
//       'X-Requested-With',
//       'Content-Type',
//       'Accept',
//       'X-Access-Token',
//     ],
//     credentials: true,
//     methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
//     origin: API_URL,
//     preflightContinue: false,
//   };
// }
console.log("app Config: %j",appConfig);

const corsOptions = {
    origin: appConfig.corsDNS,//process.env.CORS_DNS,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    
}

const app = express();

console.log("cors dns: " + appConfig.corsDNS);

//general dependencies
app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());

console.log(corsOptions)

//Routes  
app.use('/', indexRouter);
app.use('/booking', bookingRouter);
app.use('/user', userRouter);
app.use('/reservations', reservationRouter);
app.use('/stripe', stripeRouter);
app.use('/email-templates', emailTemplateRouter)


export default app;







