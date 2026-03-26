const express = require('express');
const controller = require('../controllers/technology.controller');

const router = express.Router();

router.get('/', controller.getAll);

module.exports = router;
