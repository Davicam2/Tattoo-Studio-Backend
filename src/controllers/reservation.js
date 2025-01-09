import { json, response } from 'express';
import { DateTime, Integer } from 'neo4j-driver';
import { neo4jQuery } from '../services/neo-rest-service';
import {v4 as uuidv4} from 'uuid';
import { extractNodeArray } from '../services/utils-service';


export const createDateReservation = async (req, res) => {

    const id = uuidv4();
    const resInfo = req.body;
    
    const query = `
    create (a:Reservation {
        start:${Date.parse(resInfo.start)},
        end:${Date.parse(resInfo.end)},
        allDay:${resInfo.allDay},
        title: '${resInfo.title}',
        id:'${id}'
    })`;
    
    const resp = await neo4jQuery(query)
    return res.json(resp);
}

//TODO: allow for date restricted searches
export const getReservations = async (req, res) => {

    const query = `
    match (a:Reservation) return a
    `;

    const resp = await neo4jQuery(query);
    return res.json(extractNodeArray(resp));
}

export const deleteReservation = async (req, res) => {
    const reqInfo = req.query;
    
    const query = `
    match (a:Reservation{id:'${reqInfo.id}'}) delete a
    `;

    const resp = await neo4jQuery(query);
    return res.json(resp);
}