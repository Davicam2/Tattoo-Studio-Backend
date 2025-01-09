import { neo4jQuery } from '../services/neo-rest-service';
import {v4 as uuidv4} from 'uuid';


export const verifyLogin = async (req, res) => {
    let userProfile;

    const query =  `match (a:User) where a.userName = '${req.query.userName.toLowerCase()}' and a.password = '${req.query.pass}' return a`
    const resp = await neo4jQuery(query);
    
    if(resp.records.length > 0){
        userProfile = resp.records[0]._fields[0].properties
    } else {
        userProfile = null;
    }

    console.log(resp.records);
    return res.json(userProfile);


}