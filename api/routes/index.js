/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const mailController = require('../controller/mailController');
const AuthController = require('../controller/authController');

router.get('/login', (req, res) => {
})

// Route for creation of an email
router.post('/', mailController.create);


// Route to send an email
router.post('/email-sent', mailController.sendEmail);

// Route to delete of an email
router.delete('/:id', mailController.delete);


// Route for getting all the emails
router.get('/', mailController.findAll);


module.exports = router;
