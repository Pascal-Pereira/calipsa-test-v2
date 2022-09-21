
module.exports = {
    host: '127.0.0.1',
    port: process.env.DB_PORT || '3306',
    user: 'root',
    password: 'ddojsioc',
    database: 'calipsa',
    connectionLimit: 10,
    multipleStatements: true,
}
