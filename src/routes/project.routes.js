const express = require('express');
const controller = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

const router = express.Router();

router.get('/', controller.getAllProjects);
router.get('/:id', controller.getProject);
router.post('/', authMiddleware, controller.createProject);
router.put('/:id', authMiddleware, controller.updateProject);
router.delete('/:id', authMiddleware, controller.deleteProject);
router.post('/:id/technologies', authMiddleware, controller.assignTechnologies);
router.post('/:id/links', authMiddleware, controller.addLink);
router.put('/:id/links', authMiddleware, controller.updateLinks);
router.get('/:id/links', controller.getLinks);
router.post('/:id/images', authMiddleware, upload.single('image'), controller.uploadImage);
router.delete('/:id/images/:imageId', authMiddleware, controller.deleteImage);
router.post('/:id/files', authMiddleware, upload.single('file'), controller.uploadFile);
router.delete('/:id/files/:fileId', authMiddleware, controller.deleteFile);

module.exports = router;
