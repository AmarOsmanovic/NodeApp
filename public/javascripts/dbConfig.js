const mysql = require("mysql2/promise");
const pool = mysql.createPool({
    user: 'student2301',
    host: 'bazepodataka.ba',
    database: 'student2301',
    waitForConnections: true,
    password: '19290',
    port: 7306,
    connectionLimit: 10,
});

module.exports = pool;