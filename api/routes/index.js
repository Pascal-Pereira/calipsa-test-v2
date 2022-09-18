/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController')

router.get('/login', (req, res) => {
})

router.post('/', userController.create);


module.exports = router;
