const pg = require('pg');
const config = require('../local.config')

let pgDb;

async function initConnection() {

    try {
        pgDb = new pg.Pool(config);
        await pgDb.connect();
    } catch (err) {
        console.error('[SERVICE POSTGRES] ☠ Error while connecting to database', config.database, err);
        throw err;
        // process.exit();
    }

    console.log(`connected to PG BASE CENTRALE  ${config.host} ${config.database}`);
}

if (!pgDb) {
    initConnection();
}

module.exports = pgDb;
