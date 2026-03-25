const pool = require('../config/db');

class ProjectService {

    static async getAllProjects() {
        const [rows] = await pool.query(`
            SELECT * FROM projects ORDER BY created_at DESC
        `);
        return rows;
    }

    static async getProjectById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM projects WHERE id = ?`,
            [id]
        );

        return rows[0];
    }

    static async createProject(data) {
        const {
            title,
            slug,
            description,
            short_description,
            github_url,
            live_url,
            is_featured
        } = data;

        const [result] = await pool.query(`
            INSERT INTO projects 
            (title, slug, description, short_description, github_url, live_url, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            slug,
            description,
            short_description,
            github_url,
            live_url,
            is_featured || false
        ]);

        return result.insertId;
    }

    static async updateProject(id, data) {
        const fields = [];
        const values = [];

        for (const key in data) {
            fields.push(`${key} = ?`);
            values.push(data[key]);
        }

        values.push(id);

        await pool.query(
            `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    }

    static async deleteProject(id) {
        await pool.query(`DELETE FROM projects WHERE id = ?`, [id]);
    }
}

module.exports = ProjectService;