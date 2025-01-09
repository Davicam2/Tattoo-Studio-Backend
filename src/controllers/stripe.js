import { neo4jQuery } from '../services/neo-rest-service';
import { appConfig } from '../../settings';
import { emailService, emailReplacements, emailTypes } from '../services/utils-service';

const stripe = require('stripe')(appConfig.stripeSK);

const Email_Addr = process.env.EMAIL_CLIENT_ADDRESS;
const Email_Pass = process.env.EMAIL_CLIENT_PASSWORD;



export const makeOrder = async (req, res) => {
    //console.log(req.body);
    var feObject = {};

    // const paymentIntent = await stripe.paymentIntents.create({
    //     amount: 100,
    //     currency: 'usd',
    //     metadata: {integration_check: 'accept_a_payment'}
    // })

    //get booking
    //add charge amount and call stripe
    //if success update booking as paid
    //send email confirmation
    //if fail report to FE failure and advise, FE to handle info

    ///Get Booking info from db
    const query = `match (a:Booking) where a.id = '${req.body.bookingId}' return a`;
    var bookingRequestResp = await neo4jQuery(query).then(
        res => {
            return res;
        }
    ).catch(
        err => {
            return err;
        }
    );
        
    if(!bookingRequestResp.records[0]){
        return bookingRequestResp;
    }

    //if total is already paid return error.
    if(bookingRequestResp.records[0]._fields[0].properties.finalPaid && bookingRequestResp.records[0]._fields[0].properties.finalPaid == true){
        return res.status(405).json({message: 'total already paid'});
    }

    var payment;
    //set category of payment {which value to pay against}
    if(req.body.paymentType == 'bill'){
        payment = bookingRequestResp.records[0]._fields[0].properties.cost;
    }else if(req.body.paymentType == 'deposit'){
        payment = bookingRequestResp.records[0]._fields[0].properties.depositAmount;
    }

    var charge;
    ///Generate Stripe charge
    if(req.body.paymentType != 'clear'){
         charge = await stripe.charges.create({
            amount: payment,
            currency: 'usd',
            source: req.body.paymentToken.id,
            capture: true
        }).then(res => {
                return res;
            }
        ).catch(err => {
            return err;
        });
    }
    

    //console.log('******STRIPE CHARGE RETURN******', charge);

    //charge.raw.code =='resource_missing'
    //charge.raw.type == 'invalid_request_error'

    if (req.body.paymentType == 'clear'){
        const query = `match (a:Booking) where a.id = '${req.body.bookingId}' set a += {finalPaid: true, cost: 0  } return a`
        var setPayment = await neo4jQuery(query);

        console.log('clear payment log', setPayment);

        const replacements = emailReplacements(
            emailTypes.clearPayment, 
            {
                url: appConfig.serverURL, 
                email: bookingRequestResp.records[0]._fields[0].properties.email, 
                nameFirst: bookingRequestResp.records[0]._fields[0].properties.nameFirst,
                serverURL: appConfig.serverURL
            });

        console.log("***********Email Replacements", replacements);
        console.log("***********query", bookingRequestResp.records[0]._fields[0].properties);
        console.log("********EMAIL SERVICE CALL****************");

        emailService(
            {email: Email_Addr, pass: Email_Pass},
            {
                email: bookingRequestResp.records[0]._fields[0].properties.email,
                subject: `Thanks for Visiting Andrew Saray Tattoos!`
            },
            '/clear-payment.html',
            replacements
        )

        return res.json({message: 'Service cost set to zero', service:'POS'});

    } else if(charge.status != 'succeeded' && req.body.paymentType == 'deposit'){
        const query = `match (a:Booking) where a.id = '${req.body.bookingId}' set a.depositPaid = false return a`
        var setDeposit = await neo4jQuery(query);

        feObject.netStat = charge.outcome.network_status;
        feObject.status = charge.status;
        feObject.message = charge.outcome.seller_message;
        feObject.paid = charge.paid;
        feObject.cardLastFour = charge.payment_method_details.card.last4;
        feObject.receipt = charge.receipt_url;
        feObject.refunded = charge.refunded;
        feObject.amount = charge.amount;

        return res.json(feObject);
    }else if (charge.status == 'succeeded' && req.body.paymentType == 'deposit'){

        const query = `match (a:Booking) where a.id = '${req.body.bookingId}'
         set 
            a.depositPaid = true,
            a.depositReceipt = '${charge.receipt_url}'
         return a`

        const setDeposit = await neo4jQuery(query);
        const bookingProps = setDeposit.records[0]._fields[0].properties;
        

        return res.json(charge);
    }else if (charge.status == 'succeeded' && req.body.paymentType == 'bill'){
        const query = `match (a:Booking) where a.id = '${req.body.bookingId}' set a.finalPaid = true return a`
        var setPayment = await neo4jQuery(query);
        const bookingProps = setPayment.records[0]._fields[0].properties;

        const replacements = emailReplacements(emailTypes.finalPayment, {url: appConfig.serverURL, receiptUrl: charge.receipt_url});

        console.log("***********Email Replacements", replacements);
        console.log("***********query", bookingRequestResp.records[0]._fields[0].properties);
        console.log("********EMAIL SERVICE CALL****************");

        emailService(
            {email: Email_Addr, pass: Email_Pass},
            {
                email: bookingRequestResp.records[0]._fields[0].properties.email,
                subject: `Appointment Details for ${bookingProps.nameFirst} ${bookingProps.nameLast}`
            },
            '/final-payment.html',
            replacements
        )

        return res.json(charge);
    } 
}