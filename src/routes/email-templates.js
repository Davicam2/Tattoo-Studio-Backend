import express, { request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

import {serverUrl} from '../../settings';

const emailTemplateRouter = express.Router();

emailTemplateRouter.get('/booking-accept',async function(req,res) { 
    const filePath = path.join(G_emailTemplateLocation + '/booking-accept.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);

    const replacements = {
        title: "test booking acceptance title",
        linkMessage: "test booking acceptance message",
        redirectLink: 'https://localhost:4200/public/confirm'
    }
    
    var email = template(replacements)


    res.send(email);
});

emailTemplateRouter.get('/rebook-request', function(req, res) {
    const filePath = path.join(G_emailTemplateLocation, '/booking-accept.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);

    const replacements = {
        title: "test rebook request title",
        linkMessage: "test rebook request  message",
        redirectLink: 'https://localhost:4200/public/confirm'
    }

    var email = template(replacements);
    
    res.send(email);
})

emailTemplateRouter.get('/deposit-payment', function(req, res) {
    const filePath = path.join(G_emailTemplateLocation, '/deposit-payment.html');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);

    const replacements = {
        title: "Test Deplosit Payment Title",
        linkMessage: "test deposit payment message",
        redirectLink: 'https://localhost:4200/public/confirm'
    }

    var email = template(replacements);
    
    res.send(email);
})


export default emailTemplateRouter;