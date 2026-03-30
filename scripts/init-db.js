const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const {
        DB_HOST = 'localhost',
        DB_USER = 'root',
        DB_PASSWORD = '',
        DB_PORT = 3306,
        DB_NAME
    } = process.env;

    if (!DB_NAME) {
        throw new Error('DB_NAME is missing from .env');
    }

    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: Number(DB_PORT),
        multipleStatements: true
    });

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await connection.query(`USE \`${DB_NAME}\``);
        await connection.query(schemaSql);
        console.log(`Database ${DB_NAME} is ready.`);
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error('Failed to initialize database.');
    console.error(error.message);
    process.exit(1);
});
