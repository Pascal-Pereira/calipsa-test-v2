/* eslint-disable prettier/prettier */

module.exports = {
    googleInfos: {
        CLIENT_ID: '471216317867-enmtg7vifl2aoj8iq0br506pltujugcp.apps.googleusercontent.com',
        CLIENT_SECRET: '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',
        REDIRECT_URI: 'https://developers.google.com/oauthplayground',
        REFRESH_TOKEN: '1//04KRX93bm-WmjCgYIARAAGAQSNwF-L9IrjBQ8i9w6prJzXJlevXlSSVvWrZ0wCfXeedIkKApopclqFtRMC5weO_9DeFMQfOdLJBk'
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
