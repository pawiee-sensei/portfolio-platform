const pool = require('../config/db');

function mapProjectWriteError(error) {
    if (error.code === 'ER_DUP_ENTRY') {
        const mappedError = new Error('A portfolio entry with this slug already exists.');
        mappedError.status = 409;
        throw mappedError;
    }

    throw error;
}

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

    static async replaceProjectLinks(projectId, links) {
        await pool.query(
            `DELETE FROM project_links WHERE project_id = ?`,
            [projectId]
        );

        if (!links.length) {
            return;
        }

        const values = links.map((link) => [projectId, link.label, link.url]);

        await pool.query(
            `INSERT INTO project_links (project_id, label, url) VALUES ?`,
            [values]
        );
    }

    static async getProjectLinks(projectId) {
        const [rows] = await pool.query(
            `SELECT * FROM project_links WHERE project_id = ?`,
            [projectId]
        );
        return rows;
    }

    static async getProjectImages(projectId) {
        const [rows] = await pool.query(
            `SELECT * FROM project_images WHERE project_id = ? ORDER BY created_at ASC`,
            [projectId]
        );
        return rows;
    }

    static async deleteProjectImage(projectId, imageId) {
        await pool.query(
            `DELETE FROM project_images WHERE id = ? AND project_id = ?`,
            [imageId, projectId]
        );
    }

    static async addProjectFile(projectId, fileUrl, fileName) {
        await pool.query(
            `INSERT INTO project_files (project_id, file_url, file_name) VALUES (?, ?, ?)`,
            [projectId, fileUrl, fileName]
        );
    }

    static async getProjectFiles(projectId) {
        const [rows] = await pool.query(
            `SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC`,
            [projectId]
        );
        return rows;
    }

    static async deleteProjectFile(projectId, fileId) {
        await pool.query(
            `DELETE FROM project_files WHERE id = ? AND project_id = ?`,
            [fileId, projectId]
        );
    }

    static async setProjectTechnologies(projectId, techIds) {
        await pool.query(
            `DELETE FROM project_technologies WHERE project_id = ?`,
            [projectId]
        );

        const values = techIds.map((id) => [projectId, id]);

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

    static async getProjectTechnologies(projectId) {
        const [rows] = await pool.query(
            `SELECT t.id, t.name
             FROM project_technologies pt
             INNER JOIN technologies t ON t.id = pt.technology_id
             WHERE pt.project_id = ?
             ORDER BY t.name ASC`,
            [projectId]
        );

        return rows;
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

        try {
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
        } catch (error) {
            mapProjectWriteError(error);
        }
    }

    static async updateProject(id, data) {
        const fields = [];
        const values = [];

        for (const key in data) {
            fields.push(`${key} = ?`);
            values.push(data[key]);
        }

        values.push(id);

        try {
            await pool.query(
                `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
        } catch (error) {
            mapProjectWriteError(error);
        }
    }

    static async deleteProject(id) {
        await pool.query(`DELETE FROM projects WHERE id = ?`, [id]);
    }
}

module.exports = ProjectService;

