const express = require('express');
const path = require('path');
const projectRoutes = require('./routes/project.routes');
const technologyRoutes = require('./routes/technology.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');
const authMiddleware = require('./middlewares/auth.middleware');
const upload = require('./config/multer');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/technologies', technologyRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    res.json({
        imageUrl: `/uploads/${req.file.filename}`
    });
});

// Health check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handler (LAST)
app.use(errorMiddleware);

module.exports = app;
