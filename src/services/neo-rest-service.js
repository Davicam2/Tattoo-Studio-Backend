//import {dbUserName, dbPassword, dbUri} from '../../settings'

import { appConfig } from '../../settings';
//database dependencies
const neo4j = require('neo4j-driver')


export const neo4jQuery = async (query) => {
    
    const envConf = appConfig;

    console.log(envConf)
    
    let driver = neo4j.driver(
        envConf.dbUri,  
        neo4j.auth.basic(envConf.dbUserName, envConf.dbPassword),
        {disableLosslessIntegers: true}
        );
    let session = driver.session();

    var result;

    try{
        result = await session.run( 
            query
        )
    }catch(err){
        result = err;
        console.log(err);
    }
    await session.close();
    await driver.close();
    
    return result;
}