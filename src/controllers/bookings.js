import { json, response } from 'express';
import { DateTime, Integer } from 'neo4j-driver';
import { neo4jQuery } from '../services/neo-rest-service';
import {v4 as uuidv4} from 'uuid';
import { 
    imageFilter, 
    emailService, 
    throwError, 
    getS3SignedUrl, 
    extractNodeArray,
    emailReplacements,
    emailTypes
} from '../services/utils-service';

import { appConfig } from '../../settings';

import {getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { deleteReservation } from '.';
//import {AWS} from 'aws-sdk'
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');


const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const S3_USER_KEY = process.env.AWS_S3_ACCESS_KEY_DEV;
const S3_USER_SECRET_KEY = process.env.AWS_S3_SECRET_KEY_DEV;

const Email_Addr = process.env.EMAIL_CLIENT_ADDRESS;
const Email_Pass = process.env.EMAIL_CLIENT_PASSWORD;

AWS.config.update({
    accessKeyId: S3_USER_KEY,
    secretAccessKey: S3_USER_SECRET_KEY
}) 

const s3 = new AWS.S3({
    signatureVersion: "v4",
    accessKeyId: S3_USER_KEY,
    secretAccessKey: S3_USER_SECRET_KEY
});

export const requestABooking = async (req, res) => {
    
    const PATH = './uploads';
    const bookingId = uuidv4();
    const guestInfo = req.body;
    
    console.log("aws s3 service begining");

    const dbVars = {
        nameFirst: guestInfo.nameFirst,
        nameLast: guestInfo.nameLast,
        email: guestInfo.email,
        phoneNumber: guestInfo.phoneNumber,
        ageCheck: guestInfo.ageCheck,
        tattooDesc: guestInfo.tattooDesc,
        tattooPlacement: guestInfo.tattooPlacement,
        submissionDate: Date.now(),
        isTest: true,
        status: bookingStatus.requsted,
        allDay: null,
        id: bookingId,
        bodyImgKeys: [],
        referenceImgKeys: []
    }

    for(let key of Object.keys(dbVars)){
        if(typeof dbVars[key] === 'string'){
            dbVars[key] = dbVars[key].replace(/'/g,"\\'");
        }
    }  
    

    //Image Upload Function (needs to be abstracted)
    let uploadResp =  await Promise.all(req.files.map( (image) => {
        var imgUploadParams = {
            Bucket: BUCKET_NAME,
            Key: uuidv4(),
            Body: image.buffer,
            ACL: "authenticated-read"
            
        }
        
            return s3.putObject(imgUploadParams).promise().then(
                function(res){
                    if(image.fieldname == 'bodyImgs'){
                        dbVars.bodyImgKeys.push('"' + imgUploadParams.Key + '"');
                    } else {
                        dbVars.referenceImgKeys.push( '"' + imgUploadParams.Key + '"');
                    }
                }
            );
        
        
    } ))
   
    console.log('aws s3 connection response', uploadResp);
    

    //Booking entry to database
    const query = `
    create (a:Booking {
        submissionDate:${dbVars.submissionDate},
        nameFirst:'${dbVars.nameFirst}',
        nameLast:'${dbVars.nameLast}',
        email:'${dbVars.email}',
        phoneNumber:'${dbVars.phoneNumber}',
        ageCheck:${dbVars.ageCheck},
        tattooDesc:'${dbVars.tattooDesc}',
        tattooPlacement:'${dbVars.tattooPlacement}',
        startDate: 'tbd',
        endDate: 'tbd',
        isTest:${true},
        status:'${dbVars.status}',
        allDay:'${dbVars.allDay}',
        id: '${dbVars.id}',
        bodyImgKeys: [${dbVars.bodyImgKeys}],
        referenceImgKeys: [${dbVars.referenceImgKeys}]
    })`;
    console.log(query);

    const resp = await neo4jQuery(query)

    //generate email on successful database update
    //TODO:string formatting isnt working
    if(resp.name == 'Neo4jError'){
        return res.status(500).json(throwError({error: 'db error', message:resp, status: 500}))
    }else {
        
        const replacements = emailReplacements(emailTypes.bookingRequested, {nameFirst: dbVars.nameFirst});

        
        console.log('email replacements object',replacements);
        emailService(
            {email: Email_Addr, pass: Email_Pass},
            {
                email: dbVars.email, 
                subject: `Appointment Request for ${dbVars.nameFirst} ${dbVars.nameLast}`, 
            },
            '/booking-request.html',
            replacements
        )
    }

    return res.status(200).json(resp);
}

const uploadSvc = async (req, res) => {

}


export const getBookedDates = async (req, res) => {
    const resp = await neo4jQuery('match (a:Booking) where a.endDate > datetime().epochMillis return a.endDate');
    var bookedDts = [];
    resp.records.forEach(record => {
        bookedDts.push(record._fields[0]);
    });
    
    return res.json(bookedDts);
}

export const getBookings = async (req, res) => {
    
    var multipleRecords = typeof req.query.id === 'undefined';
    var allDates = typeof req.query.futureOnly === 'undefined';
    var secure = typeof req.query.secure !== 'undefined';
    
    
    var resp;
   

    if(multipleRecords){

        if(!allDates){
            resp = await neo4jQuery(`match (a:Booking) where a.requestDateEnd > ${Date.now()} return a`)
        } else {
            resp = await neo4jQuery(`match (a:Booking) return a`);
        }
        
    }else{
        resp = await neo4jQuery(`match (a:Booking) where a.id = '${req.query.id}' return a`)
    }
    
    const bookings = [];
    
    resp.records.forEach( record => {
        if(secure){
            delete record._fields[0].properties.id;
        }
        
        bookings.push(record._fields[0].properties);
    })
   
    return res.json(bookings);
}

export const getSecureBookings = async (req, res) => {
    

    var resp = await neo4jQuery(
        ` 
        match (a:Booking)   
        return 
        a.startDate, 
        a.endDate,
        a.allDay,
        a.status
        `
    )

    let fmResp = [];

    resp.records.forEach(booking => {
        fmResp.push({
            startDate: booking._fields[0],
            endDate: booking._fields[1],
            allDay: booking._fields[2],
            status: booking._fields[3]
        })
    });

    return res.json(fmResp);
}

export const getBooking = async (req, res) => {
    console.log(req.query.id);

    var resp = await neo4jQuery(`match (a:Booking) where a.id = '${req.query.id}' return a`);
    
    
    console.log("\*********: Get Booking Response", resp.records);

    if(resp.records.length == 0){
        return res.json(throwError({error: 'invalid booking id', message:'booking is not valid for public use', status: 401}));
    }
    var bookingProps = resp.records[0]._fields[0].properties;
    if( bookingProps.status != 'accepted'    ){
        return res.json(throwError({error: 'invalid booking id', message:'booking is not valid for public use', status: 401}));
    }else{
        return res.json(resp.records[0]._fields[0].properties);
    }
}


export const accept = async (req, res) => {
   
    
    const bookingQuery = 
    `match (a:Booking) 
    where a.id = '${req.body.id}' 
    set a += {
        status:'accepted',
        allDay: ${req.body.form.aptLength === 'allDay' ? true: false},
        cost: ${req.body.form.tattooCost * 100},
        adminComments: '${req.body.form.adminComments}',
        depositAmount: ${req.body.form.depositAmount * 100},
        dateRequestAccepted: ${Date.now()}
    }
    return a`;

    const bookingDetailsResponse = await neo4jQuery(bookingQuery);
    const bookingDetails = bookingDetailsResponse.records[0]._fields[0].properties

   

    //TODO split the length var 
    const replacements = emailReplacements(emailTypes.bookingAccepted,
        {
            aptLength: req.body.form.aptLength,
            depositAmount: req.body.form.depositAmount,
            cost: bookingDetails.cost,
            serverURL: appConfig.serverURL,
            id: bookingDetails.id
        });
    
    
    console.log(replacements);
    emailService(
        {email: Email_Addr, pass: Email_Pass},
        {
            email: bookingDetails.email, 
            subject: `Appointment Approved for ${bookingDetails.nameFirst} ${bookingDetails.nameLast}`, 
        },
        '/booking-accept.html',
        replacements
    )

    return res.json(bookingDetails)

}

export const reject = async (req, res) => {

    const imageIdsReturn = await neo4jQuery(`match (a:Booking) where a.id = '${req.query.id}' return a.bodyImgKeys, a.referenceImgKeys`);
    
    if(!imageIdsReturn){
        return res.json({status: failed});
    }

    const resp = await neo4jQuery(`match (a:Booking) where a.id = '${req.query.id}' delete a`);
    //break if failed to delete
    if(!resp.summary){
        return res.json(resp);
    }
    
    console.log(imageIdsReturn.records)

    let imageIds = [];
    if(imageIdsReturn.records.length > 0){
        console.log('first image array')
        if(imageIdsReturn.records[0]._fields[0].length > 0){
            imageIdsReturn.records[0]._fields[0].forEach(element => {
                imageIds.push({Key: element});
            });   
        }
    }
    
    if(imageIdsReturn.records.length > 0){
        if(imageIdsReturn.records[0]._fields[1].length > 0){
            imageIdsReturn.records[0]._fields[1].forEach(element => {
                imageIds.push({Key: element});
            });
        }
    }
    

    var imgDeleteParams = {
        Bucket: BUCKET_NAME,
        Delete: {Objects: imageIds} 
    }

    var deleteResp = await s3.deleteObjects(imgDeleteParams, function(err, data){
        if (err) console.log(err);
        else return data; 
        
    }).promise();
    console.log(deleteResp)
    
    return res.json(deleteResp);
}

export const cancel = async (req, res) => {
    
    const resp = await neo4jQuery(`match (a:Booking) where a.id = '${req.body.id}' set a.status = 'accepted' return a`)
    
    if(resp){
        const bookingDetails = resp.records[0]._fields[0].properties;

        const replacements = emailReplacements(
            emailTypes.rebookRequest, 
            {
                nameFirst: bookingDetails.nameFirst, 
                serverUrl: appConfig.serverURL,
                id: bookingDetails.id
            });
        
        
        emailService(
            {email: Email_Addr, pass: Email_Pass},
            {
                email: bookingDetails.email, 
                subject: `Appointment Reschedule for ${bookingDetails.nameFirst} ${bookingDetails.nameLast}`
            },
            '/rebook-request.html',
            replacements
        )
    }

    console.log(resp.records)
    return res.json(resp.records[0]._fields[0].properties);
}

export const getBookingImages = async (req, res) => { 

    const id = req.body.id;

    const queryResp = await neo4jQuery(`match (a:Booking) where a.id = '${req.query.id}' return a.bodyImgKeys, a.referenceImgKeys`);

   
    console.log(queryResp.records[0]._fields)
    let bodyImagekeys = queryResp.records[0]._fields[0];
    let referenceImageKeys = queryResp.records[0]._fields[1];
    
    let bodyUrls = [];
    let refUrls = []; 

    for(const key of bodyImagekeys){
        const url = await getS3SignedUrl(key,BUCKET_NAME,s3);
        bodyUrls.push(url);
    }
    for(const key of referenceImageKeys){
        const url = await getS3SignedUrl(key,BUCKET_NAME,s3);
        refUrls.push(url);
    }

    console.log('Images being returned',bodyUrls, refUrls);

    return res.json({bodyUrls, refUrls});
}


export const updateBookingDate = async (req, res) => {
    console.log(req.body);

    const resp = await neo4jQuery(
        `match (a:Booking) where a.id = '${req.body.id}' 
        set 
            a.startDate = ${Date.parse(req.body.start)},
            a.endDate = ${Date.parse(req.body.end)},
            a.status = 'booked'
        return a`
    )
    const props = resp.records[0]._fields[0].properties;

    if(props.depositReceipt){

        const adminSettingsQuery = 
        `
        match (a:User) 
        where a.userName = 'andman' 
        return a`;
    
        const adminSettingsResponse = await neo4jQuery(adminSettingsQuery);
        const adminSettingsProps = adminSettingsResponse.records[0]._fields[0].properties;

        let appointmentStartTime = '';

        const bookingStartDate = new Date(props.startDate);

        console.log('***********************', bookingStartDate);


        if(props.allDay || bookingStartDate.getHours() <= 12){
            appointmentStartTime = ` ${adminSettingsProps.amStartTime} AM`;
        } else {
            appointmentStartTime = `${adminSettingsProps.pmStartTime} PM`;
        }

        const replacements = emailReplacements(emailTypes.depositPayment, 
            {
                bookingStartDate: bookingStartDate,
                appointmentStartTime: appointmentStartTime,
                cost: props.cost,
                depositReceipt: props.depositReceipt
            });

        emailService(
            {email: Email_Addr, pass: Email_Pass},
            {
                email: props.email,
                subject: `Appointment Details for ${props.nameFirst} ${props.nameLast}`
            },
            '/deposit-payment.html',
            replacements
        )
    }
    
    return res.json(resp.records[0]._fields[0].properties)
}
//TODO: handle db error
export const updateProperty = async (req, res) => {
    console.log('update booking api', req.body);

    const resp = await neo4jQuery(
        `match (a:Booking) where a.id = '${req.body.id}'
        set
            a.${req.body.key} = ${req.body.value}
        return a`
    )
    return res.json(extractNodeArray(resp)[0]);
}

export const neoTest = async (req, res) => {
    return res.json({response: 'good test'});
}


const bookingStatus = {
    requsted: 'requested',
    accepted: 'accepted',
    rejected: 'rejected',
    booked: 'booked'
}
