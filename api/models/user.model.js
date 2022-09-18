/* eslint-disable prettier/prettier */
const db = require('../db.js');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;

class User {
  static async create (newUser) {
    const hash = await argon2.hash(newUser.password);
    const addUser = { ...newUser, password: hash };
    return db.query('INSERT INTO user (email, password, createdOn) VALUES (?, ?, ?)',
      [addUser.email,  addUser.password,  addUser.createdOn])
      .then(res => {
        newUser.id = res.insertId;
        const { password, ...addUser } = newUser;
        return addUser;
      })
      .catch((err) => {
        console.error('[ERROR USER MODEL][CREATE]_____email_____', err.message);
        throw err;
      })
  }


  static async emailAlreadyExists (email) {
    return db.query('SELECT * FROM user WHERE email = ?', [email])
      .then(rows => {
        if (rows.length) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      });
  }

  static async getAll (result) {
    return db.query('SELECT * FROM user')
      .then(rows => rows.map(row => {
        delete row.password;
        return row;
      }));
  }

  static async login (email, password) {
    let user = await User.findByEmail(email);

    if (!user) {
      throw new Error('user not found');
    } else {
      const passwordIsValid = await argon2.verify(user.password, password);
      if (!passwordIsValid) {
        throw new Error('incorrect password');
      } else {
        const data = { name: user.name, id: user.id };
        const token = jwt.sign(data, JWT_PRIVATE_KEY, { expiresIn: '48h' });
        const userWithoutPassord = { password: '', ...user };
        user = { ...userWithoutPassord, last_connection_date: new Date().toISOString().slice(0, 10) };
        await User.updateById(data.id, user);
        return Promise.resolve({ token, data, user });
      }
    }
  }
  
  static async remove (id) {
    return db.query('DELETE FROM user WHERE id = ?', id).then(res => {
      if (res.affectedRows !== 0) {
        return Promise.resolve();
      } else {
        const err = new Error();
        err.kind = 'not_found';
        return Promise.reject(err);
      }
    });
  }

}

module.exports = User;