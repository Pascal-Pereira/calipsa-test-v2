/* eslint-disable no-undef */
const express = require('express');

const router = express.Router();

router.get('/login', (req, res) => {
    res.send('heyyyyyyyyyyyyyyyyyyyyy')
})

module.exports = router;
