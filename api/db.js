/* eslint-disable prettier/prettier */
require('dotenv').config();
const mysql = require('mysql2');

const config = require('./local.config');

class Database {
  init () {
    try {
      console.log('[MYSQL] init mySQL connection', config);
      this.connection = mysql.createPool(config);
      console.log('[MYSQL] initMysql successfull');
    } catch (e) {
      console.warn('[MYSQL] initMysql error');
      throw e;
    }
    return this;
  }

  query (...args) {
    return new Promise((resolve, reject) => {
      this.connection.query(...args, (err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res);
        }
      });
    });
  }

  // closeConnection () {
  //   return new Promise((resolve, reject) => {
  //     if (this.connection) {
  //       this.connection.end((err, res) => {
  //         if (err) reject(err);
  //         else resolve();
  //       });
  //     } else {
  //       return resolve();
  //     }
  //   });
  // }
}

module.exports = (new Database()).init();
