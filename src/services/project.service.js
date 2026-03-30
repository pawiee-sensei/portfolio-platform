const pool = require('../config/db');

class ProjectService {

    static async addProjectImage(projectId, imageUrl) {
        await pool.query(
            `INSERT INTO project_images (project_id, image_url) VALUES (?, ?)`,
            [projectId, imageUrl]
        );
    }

    static async addProjectLink(projectId, label, url) {
        await pool.query(
            `INSERT INTO project_links (project_id, label, url) VALUES (?, ?, ?)`,
            [projectId, label, url]
        );
    }

    static async getProjectLinks(projectId) {
        const [rows] = await pool.query(
            `SELECT * FROM project_links WHERE project_id = ?`,
            [projectId]
        );
        return rows;
    }

    static async addProjectFile(projectId, fileUrl, fileName) {
        await pool.query(
            `INSERT INTO project_files (project_id, file_url, file_name) VALUES (?, ?, ?)`,
            [projectId, fileUrl, fileName]
        );
    }

    static async setProjectTechnologies(projectId, techIds) {
    // Remove old
    await pool.query(
        `DELETE FROM project_technologies WHERE project_id = ?`,
        [projectId]
    );

    // Insert new
    const values = techIds.map(id => [projectId, id]);

    if (values.length > 0) {
        await pool.query(
            `INSERT INTO project_technologies (project_id, technology_id) VALUES ?`,
            [values]
        );
    }
}

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
            is_featured,
            category,
            thumbnail_url,
            project_year,
            client_name,
            medium,
            status
        } = data;

        const [result] = await pool.query(`
            INSERT INTO projects 
            (
                title, slug, description, short_description,
                github_url, live_url, is_featured,
                category, thumbnail_url, project_year,
                client_name, medium, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            slug,
            description,
            short_description,
            github_url || null,
            live_url || null,
            is_featured || false,
            category || 'web',
            thumbnail_url || null,
            project_year || null,
            client_name || null,
            medium || null,
            status || 'published'
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

