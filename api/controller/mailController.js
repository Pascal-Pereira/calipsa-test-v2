/* eslint-disable prettier/prettier */
require('dotenv').config();
const Mail = require('../models/mail.model.js');
const nodemailer = require('nodemailer');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const validateEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};



// Création du transporteur pour l'envoi d'mails (NodeMailer)
async function sendEmail(data) {
    // Transporteur
    const transporter = nodemailer.createTransport({
        host: 'in-v3.mailjet.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    /* const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT), // 587
      secure: isSecureConnection, // process.env.EMAIL_SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // User
        pass: process.env.EMAIL_PASS, // Password
        clientId: process.env.EMAIL_SMTP_CLIENT_ID,
        clientSecret: process.env.EMAIL_SMTP_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_SMTP_REFRESH_TOKEN,
        accessToken: process.env.EMAIL_SMTP_ACCESS_TOKEN,
        expires: process.env.EMAIL_SMTP_EXPIRES
      }
    }); */

    try {
        const emailBody = {
            from: 'Pierre Ammeloot <pierre@ammeloot.fr>',
            to: `${data.firstname} ${data.lastname} ${data.email}`,
            subject: 'Annuaire des Freelances Lyonnais - Le processus d’inscription est bientôt terminé',
            Text: `Cher(e) Freelance Lyonnais,
      Nous te remercions pour ton inscription sur l’annuaire des Freelances Lyonnais.
      Il ne te reste plus qu'à valider ton adresse email en collant le lien ci-dessous dans ton navigateur :
      A bientôt,
      Pierre.

      "${process.env.BASE_URL}/users/validation_email?email=${data.email}&key=${data.key}"`,

            html: `<p>Cher(e) Freelance Lyonnais,</Il>
      <p>Nous te remercions pour ton inscription sur l’annuaire des Freelances Lyonnais.</p>
      <p>Il ne te reste plus qu'à valider ton adresse email en copiant ou cliquant sur le lien ci-dessous :</p>
      <a href="${process.env.BASE_URL}/users/validation_email?email=${data.email}&key=${data.key}">Vérification email</a>
      <p>À bientôt,</p>
      <p>Pierre</p>`
        };

        if (process.env.NODE_ENV !== 'test') {
            await transporter.sendMail(emailBody);
        }
    } catch (error) {
        return console.error('Erreur', error);
    }
}

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
}

module.exports = mailController;
