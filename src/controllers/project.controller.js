const ProjectService = require('../services/project.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectService.getAllProjects();

    res.json({
        success: true,
        data: projects
    });
});

exports.getProject = asyncHandler(async (req, res) => {
    const project = await ProjectService.getProjectById(req.params.id);

    if (!project) {
        const error = new Error('Project not found');
        error.status = 404;
        throw error;
    }

    res.json({
        success: true,
        data: project
    });
});

exports.createProject = asyncHandler(async (req, res) => {
    const id = await ProjectService.createProject(req.body);

    res.status(201).json({
        success: true,
        message: 'Project created',
        id
    });
});

exports.updateProject = asyncHandler(async (req, res) => {
    await ProjectService.updateProject(req.params.id, req.body);

    res.json({
        success: true,
        message: 'Project updated'
    });
});

exports.deleteProject = asyncHandler(async (req, res) => {
    await ProjectService.deleteProject(req.params.id);

    res.json({
        success: true,
        message: 'Project deleted'
    });
});

exports.assignTechnologies = asyncHandler(async (req, res) => {
    const { techIds } = req.body;

    await ProjectService.setProjectTechnologies(req.params.id, techIds);

    res.json({
        success: true,
        message: 'Technologies updated'
    });
});

exports.uploadImage = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No image file uploaded'
        });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    await ProjectService.addProjectImage(projectId, imageUrl);

    res.json({
        success: true,
        imageUrl
    });
});
