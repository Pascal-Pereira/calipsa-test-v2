

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'ddojsioc',
    database: process.env.DB_NAME || 'calipsa',
    connectionLimit: 10,
    multipleStatements: true,
    google: {
      clientId: '735540248134-ggfesuvs015qf6f1fqs79aufslflp29s.apps.googleusercontent.com',
      clientSecret: 'lohVoqWwUOoyMydu_z_DIPfQ',
      redirectUrl: 'http://localhost:1337/auth/google/callback',
    },
}
