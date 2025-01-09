import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');


export const imageFilter = (file) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return new Error('Only image files are allowed!');
    }   
    return null;
    
}

//from = {email:string, pass:string}
//to = {email: string, subject: string, html: template}
export const emailService = async (from, to, templatePath, replacements) => {

    const emailTemplatePath = path.join(G_emailTemplateLocation, templatePath);
    const emlSrc = fs.readFileSync(emailTemplatePath, 'utf-8').toString();
    const template = handlebars.compile(emlSrc);

    const EmailHtml = template(replacements);

    const transport = {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth:{
            user: from.email,
            pass: from.pass
        }
    }

    const transporter = nodemailer.createTransport(smtpTransport(transport))
    transporter.verify((error,success) => {
        if(error){
            console.log('email error', error);
            return throwError('Email Failure');
        }else {
            console.log('sending email');
        }
    })
    
    transporter.use()

    var mailOptions = {
        from: from.email,
        to: to.email,
        subject: to.subject,
        html: EmailHtml
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        } else {
            console.log('Email Sent: ' + info.response)
        }
    })
}

//TODO: handle empty response object
export const extractNodeArray = (neoResponse) => {

    let arr = [];

    neoResponse.records.forEach( record => {
        arr.push(record._fields[0].properties);
    })
    return arr
}

export const throwError = (error) => { 
    try{
        throw new Error(error.error);
    }catch(err){
        
        return error = {
                message: error.message,
                status: error.status,
                error: true,
                errorType: error.error
            }

    }
}

export const getS3SignedUrl = async (key,bucketName, s3) => {

    const url = await s3.getSignedUrlPromise('getObject',{
        Bucket: bucketName,
        Key: key,
        Expires: (60 * 10)
    })
    
    return url;
  

}

export const emailReplacements = (email, content) => {
    var month = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

    console.log('email replacement values', email, content);

    if( email == emailTypes.bookingRequested){

        const replacements = {
            title: "Title",
            greeting: `Hello ${content.nameFirst}, <br /><br />`,
            linkMessage: "We have received your request! The artist will review your request within 5 days. If your request is approved, you will receive an email with scheduling and deposit details. If you do not receive a response, then the artist is unable to accommodate your request. ",
        }
        return replacements;
    }else if( email == emailTypes.bookingAccepted){
        
        const replacements = {
            title: `Title`,
            linkMessage: `Your appointment request has been approved! Here are the details for your request:
            <br /> Length: ${content.aptLength == 'halfDay' ? 'Half Day' : 'Full Day'} 
            <br /> Deposit: $${content.depositAmount}
            <br /> Remaining Cost: $${content.cost / 100}
            <br />  
            <br /> Click the following link to book a time and pay the deposit:`,
            redirectLink: `${content.serverURL}/public/confirm/${content.id}`
        }
        return replacements;

    }else if( email == emailTypes.depositPayment){

        const replacements = {
            title: `Title`,
            linkMessage: 
            `Thanks for scheduling your appointment! Here are the details:
            <br/> Date: ${month[content.bookingStartDate.getMonth()]} ${content.bookingStartDate.getDate()}
            <br/> Time: ${content.appointmentStartTime}
            <br/> Remaining Cost: $${content.cost / 100}
            <br/>
            `,
            
            redirectLink: `${content.depositReceipt}`
        }
        return replacements;

    }else if( email == emailTypes.finalPayment){

        const replacements = {
            title: `Title`,
            linkMessage: 
            `Thank you for visiting! We hope you enjoyed your experience. To see the receipt for your final payment, click this link: `,
            receiptLink: content.receiptUrl,
            body: `
            <br/> 
            <br/> For aftercare tips, click this link: `,
            redirectLink: `${content.url}/public/faq`
        }
        return replacements;

    }else if( email == emailTypes.rebookRequest){

        const replacements = {
            title: "Title",
            greeting:`Hello ${content.nameFirst}, <br/>`,
            rescheduleMessage: `<br/> We need to reschedule your appointment. Click the following link to book a new time: `,
            linkMessage: ` <br/> Additional payment is not required. Thanks for your flexibility!`,
            redirectLink: `${content.serverURL}/public/confirm/${content.id}`
        }
        return replacements;
    }else if(email == emailTypes.clearPayment){
        const replacements = {
            title: "Title",
            message: `Hello ${content.nameFirst}, Thank you for visiting! We hope you enjoyed your experience. For after care tips, click this link.`,
            redirectLink: `${content.serverURL}/public/faq`
        }
        return replacements;
    }
}

export const emailTypes = {
    bookingRequested: 'request',
    bookingAccepted: 'accepted',
    depositPayment: 'deposit',
    finalPayment: 'payment',
    rebookRequest: 'rebook',
    clearPayment: 'clear'
}
