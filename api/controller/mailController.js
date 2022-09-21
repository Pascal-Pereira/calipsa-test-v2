/* eslint-disable prettier/prettier */
require('dotenv').config();
const Mail = require('../models/mail.model.js');
const MailService = require('../services/MailService');


const validateEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

class mailController {
    static async create(req, res) {
        let newEmail = req.body;
        if(!newEmail) {
            return;
        }
        if (!newEmail.email) {
            return res.status(422).send({ errorMessage: 'Content can not be empty!' });
        }
        if (!validateEmail(newEmail.email)) {
            return res.status(422).send({ errorMessage: 'A valid email is required !' });
        }
        try {
            newEmail = {
                ...newEmail,
                createdOn: new Date().toISOString().slice(0, 10)
            };
            const data = await Mail.create(newEmail);
            return res.status(201).send(data);
        } catch (err) {
            console.error('[ERROR Mail CONTROLLER][CREATE]', err.message);
            res.status(500).send({
                errorMessage: err.message || 'Some error occurred while creating the User.'
            });
        }
    }

    static async findAll(req, res) {
        try {
            const data = (await Mail.getAll()).map(c => c);
            res.send({ data });
        } catch (err) {
            console.error('[ERROR MAIL CONTROLLER][FIND ALL]', err.message);
            res.status(500).send({
                errorMessage: err.message || 'Some error occurred while retrieving the emails.'
            });
        }
    }

    static async findOne(req, res) {
        try {
            const data = await Mail.findById(req.params.id);
            res.send({ data });
        } catch (err) {
            if (err.kind === 'not_found') {
                res.status(404).send({ errorMessage: `User with id ${req.params.id} not found.` });
            } else {
                res.status(500).send({ errorMessage: 'Error retrieving User with id ' + req.params.id });
            }
        }
    }

    static async update(req, res) {
        if (!req.body) {
            res.status(400).send({ errorMessage: 'Content can not be empty!' });
        }

        try {
            const data = await Mail.updateById(req.params.id, (req.body));
            res.send({ data });
        } catch (err) {
            if (err.kind === 'not_found') {
                res.status(404).send({ errorMessage: `Mail with id ${req.params.id} not found.` });
            } else {
                res.status(500).send({ errorMessage: 'Error updating Mail with id ' + req.params.id });
            }
        }
    }


    static async delete(req, res) {
        try {
            await Mail.remove(req.params.id);
            res.send({ message: 'Mail was deleted successfully!' });
        } catch (err) {
            if (err.kind === 'not_found') {
                res.status(404).send({
                    message: `Mail Not found with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: 'Could not delete email with id ' + req.params.id
                });
            }
        }
    }

    static async sendEmail(req, res) {
        const { recipient,subject, message } = req.body;
        if(!recipient) {
            return res.status(400).send('Missing recipient')
        }
        if(!subject) {
            return res.status(400).send('Missing subject')
        }
        if(!recipient || !message) {
            return res.status(400).send('Missing message')
        }
        try {
            await MailService.sendEmail(recipient, subject, message);
            res.send(`Email sent to ${recipient}`);
        } catch (err) {
            console.error('[ERROR MAILCONTROLLER sendEmail', err)
            res.status(500).send({
                message: 'Could not send email with recipient ' + recipient
            });
        }
    }
}

module.exports = mailController;
