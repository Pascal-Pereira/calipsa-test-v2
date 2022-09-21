/* eslint-disable prettier/prettier */
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const sgTransport = require('nodemailer-sendgrid-transport');
const config = require('../local.config');

// These id's and secrets should come from .env file.
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REFRESH_TOKEN, sendgrid, mail } =  config;
const transport = mail.transport;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function getTransport() {
  let transporter;
  const accessToken = await oAuth2Client.getAccessToken();

  // create Nodemailer SES transporter
  switch (transport) {
      case 'sendgrid':
        transporter = nodemailer.createTransport(sgTransport(sendgrid));
        break;
      case 'gmail':
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: 'pereira.pascal@gmail.com',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
          },
        });


        break;
      case 'smtp':
      default:
        transporter = nodemailer.createTransport(mail.options);
        break;
  }
  return transporter;
}

async function sendEmail(recipient, subject, message) {
  try {
    const transport = await getTransport();

    const mailOptions = {
      from: 'pereira.pascal@gmail.com',
      to: recipient,
      subject,
      text: message,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

module.exports = { sendEmail };
