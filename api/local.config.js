
module.exports = {
    mysql: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '3306',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'ddojsioc',
        database: process.env.DB_NAME || 'calipsa',
        connectionLimit: 10,
        multipleStatements: true,
    },
    google: {
        clientId: '505828133465-1rg5jnm6n1qq3p718l2hocfn365qhipd.apps.googleusercontent.com',
        clientSecret: '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',
        redirectUri: 'http://localhost:3000/auth/google/callback',
    }
}
