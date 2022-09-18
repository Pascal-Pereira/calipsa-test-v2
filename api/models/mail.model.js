/* eslint-disable prettier/prettier */
const db = require('../db.js');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;

class Mail {
  static async create (emailObj) {
    return db.query('INSERT INTO email (email, createdOn) VALUES (?, ?)',
      [emailObj.email, emailObj.createdOn])
      .then(res => {
        emailObj.id = res.insertId;
        return emailObj;
      })
      .catch((err) => {
        console.error('[ERROR EMAIL MODEL][CREATE]_____email_____', err.message);
        throw err;
      })
  }


  static async emailAlreadyExists (email) {
    return db.query('SELECT * FROM email WHERE email = ?', [email])
      .then(rows => {
        if (rows.length) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      });
  }

  static async getAll () {
    return db.query('SELECT * FROM email')
      .then(rows => rows.map(row => {
        return row;
      }));
  }

  
  static async remove (id) {
    return db.query('DELETE FROM email WHERE id = ?', id).then(res => {
      if (res.affectedRows !== 0) {
        return Promise.resolve({id});
      } else {
        const err = new Error();
        err.kind = 'not_found';
        return Promise.reject(err);
      }
    });
  }

}

module.exports = Mail;
