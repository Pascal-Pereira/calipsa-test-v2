const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// These id's and secrets should come from .env file.
const CLIENT_ID = '471216317867-enmtg7vifl2aoj8iq0br506pltujugcp.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04KRX93bm-WmjCgYIARAAGAQSNwF-L9IrjBQ8i9w6prJzXJlevXlSSVvWrZ0wCfXeedIkKApopclqFtRMC5weO_9DeFMQfOdLJBk';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendEmail(recipient, message) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
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

    const mailOptions = {
      from: 'pereira.pascal@gmail.com',
      to: recipient,
      subject: 'Hello from gmail using API',
      text: message,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

module.exports = { sendEmail };
