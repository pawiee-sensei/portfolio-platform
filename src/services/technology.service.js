const pool = require('../config/db');

class TechnologyService {
    static async getAll() {
        const [rows] = await pool.query(`
            SELECT * FROM technologies ORDER BY name ASC
        `);

        return rows;
    }
}

module.exports = TechnologyService;
