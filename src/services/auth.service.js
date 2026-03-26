const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class AuthService {
    static async signup(email, password) {
        if (!email || !password) {
            const error = new Error('Email and password are required');
            error.status = 400;
            throw error;
        }

        const [existingUsers] = await pool.query(
            `SELECT id FROM users WHERE email = ?`,
            [email]
        );

        if (existingUsers.length > 0) {
            const error = new Error('Email already exists');
            error.status = 409;
            throw error;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
            [email, passwordHash]
        );

        return {
            id: result.insertId,
            email
        };
    }

    static async login(email, password) {
        if (!email || !password) {
            const error = new Error('Email and password are required');
            error.status = 400;
            throw error;
        }

        const [rows] = await pool.query(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );

        const user = rows[0];

        if (!user) {
            const error = new Error('Invalid credentials');
            error.status = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const error = new Error('Invalid credentials');
            error.status = 401;
            throw error;
        }

        return user;
    }
}

module.exports = AuthService;
