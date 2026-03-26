const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class AuthService {

    static async login(email, password) {
        const [rows] = await pool.query(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );

        const user = rows[0];

        if (!user) throw new Error('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) throw new Error('Invalid credentials');

        return user;
    }
}

module.exports = AuthService;