/* eslint-disable prettier/prettier */

module.exports = {
  googleInfos: {
      CLIENT_ID: '',
      CLIENT_SECRET: '',
      REDIRECT_URI: '',
      REFRESH_TOKEN: ''
  },
  mail: {
      transport: 'maildev',//'maildev', //'gmail', // 'sendgrid'
      protocol: 'SMTP',
      options: {
          host: '127.0.0.1',
          port: 1025
      },
      from: 'hello@applocal.com',
  },
  sendgrid: {
      auth: {
          api_key: ''
      }
  }
}
/* eslint-disable prettier/prettier */
