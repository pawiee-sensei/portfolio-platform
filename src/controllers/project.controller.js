const ProjectService = require('../services/project.service');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_CATEGORIES = new Set([
    'web',
    'app',
    'graphic-design',
    'poster',
    'pubmat',
    'art',
    'poetry',
    'photography',
    'branding',
    'other'
]);

const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived']);

function createValidationError(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

function isValidUrl(value) {
    if (!value) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function validateLinksPayload(payload) {
    if (!Array.isArray(payload)) {
        throw createValidationError('Links payload must be an array.');
    }

    return payload.map((item) => {
        const label = normalizeText(item.label, 255);
        const url = normalizeText(item.url, 500);

        if (!label || !url) {
            throw createValidationError('Each link must include a label and a URL.');
        }

        if (!isValidUrl(url)) {
            throw createValidationError('Each link URL must be a valid http/https URL.');
        }

        return { label, url };
    });
}

function normalizeText(value, maxLength = null) {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== 'string') {
        throw createValidationError('Invalid text field value.');
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    if (maxLength && trimmedValue.length > maxLength) {
        throw createValidationError(`Field exceeds maximum length of ${maxLength} characters.`);
    }

    return trimmedValue;
}

function normalizeBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    return Boolean(value);
}

function validateSlug(slug) {
    if (!slug) {
        throw createValidationError('Slug is required.');
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw createValidationError('Slug must contain only lowercase letters, numbers, and hyphens.');
    }

    return slug;
}

function validateProjectYear(value) {
    if (!value) {
        return null;
    }

    const year = String(value).trim();

    if (!/^\d{4}$/.test(year)) {
        throw createValidationError('Project year must be a 4-digit year.');
    }

    return year;
}

function validateProjectPayload(payload, { partial = false } = {}) {
    const hasField = (key) => Object.prototype.hasOwnProperty.call(payload, key);
    const title = normalizeText(payload.title, 255);
    const slug = payload.slug === undefined || payload.slug === null
        ? null
        : validateSlug(normalizeText(payload.slug, 255));
    const category = normalizeText(payload.category, 50);
    const status = normalizeText(payload.status, 50);
    const githubUrl = normalizeText(payload.github_url, 500);
    const liveUrl = normalizeText(payload.live_url, 500);
    const thumbnailUrl = normalizeText(payload.thumbnail_url, 255);
    const projectYear = validateProjectYear(payload.project_year);
    const clientName = normalizeText(payload.client_name, 150);
    const medium = normalizeText(payload.medium, 150);
    const shortDescription = normalizeText(payload.short_description);
    const description = normalizeText(payload.description);

    if (!partial && !title) {
        throw createValidationError('Title is required.');
    }

    if (!partial && !slug) {
        throw createValidationError('Slug is required.');
    }

    if (category && !ALLOWED_CATEGORIES.has(category)) {
        throw createValidationError('Invalid category.');
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
        throw createValidationError('Invalid status.');
    }

    if (!isValidUrl(githubUrl)) {
        throw createValidationError('GitHub or reference URL must be a valid http/https URL.');
    }

    if (!isValidUrl(liveUrl)) {
        throw createValidationError('Live or project URL must be a valid http/https URL.');
    }

    if (thumbnailUrl && !thumbnailUrl.startsWith('/uploads/') && !isValidUrl(thumbnailUrl)) {
        throw createValidationError('Thumbnail URL must be an uploaded asset path or valid http/https URL.');
    }

    if (partial) {
        const partialPayload = {};

        if (hasField('title') && title) partialPayload.title = title;
        if (hasField('slug') && slug) partialPayload.slug = slug;
        if (hasField('description')) partialPayload.description = description;
        if (hasField('short_description')) partialPayload.short_description = shortDescription;
        if (hasField('github_url')) partialPayload.github_url = githubUrl;
        if (hasField('live_url')) partialPayload.live_url = liveUrl;
        if (hasField('is_featured')) partialPayload.is_featured = normalizeBoolean(payload.is_featured);
        if (hasField('category') && category) partialPayload.category = category;
        if (hasField('thumbnail_url')) partialPayload.thumbnail_url = thumbnailUrl;
        if (hasField('project_year')) partialPayload.project_year = projectYear;
        if (hasField('client_name')) partialPayload.client_name = clientName;
        if (hasField('medium')) partialPayload.medium = medium;
        if (hasField('status') && status) partialPayload.status = status;

        return partialPayload;
    }

    return {
        title,
        slug,
        description,
        short_description: shortDescription,
        github_url: githubUrl,
        live_url: liveUrl,
        is_featured: normalizeBoolean(payload.is_featured),
        category: category || 'web',
        thumbnail_url: thumbnailUrl,
        project_year: projectYear,
        client_name: clientName,
        medium,
        status: status || 'published'
    };
}

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

    const [images, links, files, technologies] = await Promise.all([
        ProjectService.getProjectImages(req.params.id),
        ProjectService.getProjectLinks(req.params.id),
        ProjectService.getProjectFiles(req.params.id),
        ProjectService.getProjectTechnologies(req.params.id)
    ]);

    res.json({
        success: true,
        data: {
            ...project,
            images,
            links,
            files,
            technologies
        }
    });
});

exports.createProject = asyncHandler(async (req, res) => {
    const projectData = validateProjectPayload(req.body);
    const id = await ProjectService.createProject(projectData);

    res.status(201).json({
        success: true,
        message: 'Project created',
        id
    });
});

exports.updateProject = asyncHandler(async (req, res) => {
    const projectData = validateProjectPayload(req.body, { partial: true });

    if (!Object.keys(projectData).length) {
        throw createValidationError('No valid project fields were provided.');
    }

    await ProjectService.updateProject(req.params.id, projectData);

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

exports.addLink = asyncHandler(async (req, res) => {
    const { label, url } = req.body;

    await ProjectService.addProjectLink(req.params.id, label, url);

    res.json({ success: true });
});

exports.updateLinks = asyncHandler(async (req, res) => {
    const links = validateLinksPayload(req.body.links);

    await ProjectService.replaceProjectLinks(req.params.id, links);

    res.json({
        success: true,
        message: 'Links updated'
    });
});

exports.getLinks = asyncHandler(async (req, res) => {
    const links = await ProjectService.getProjectLinks(req.params.id);

    res.json({ success: true, data: links });
});

exports.uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    await ProjectService.addProjectFile(
        req.params.id,
        fileUrl,
        req.file.originalname
    );

    res.json({ success: true, fileUrl });
});

exports.deleteImage = asyncHandler(async (req, res) => {
    await ProjectService.deleteProjectImage(req.params.id, req.params.imageId);

    res.json({
        success: true,
        message: 'Image removed'
    });
});

exports.deleteFile = asyncHandler(async (req, res) => {
    await ProjectService.deleteProjectFile(req.params.id, req.params.fileId);

    res.json({
        success: true,
        message: 'File removed'
    });
});
