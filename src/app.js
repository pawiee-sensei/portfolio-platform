const express = require('express');
const projectRoutes = require('./routes/project.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handler (LAST)
app.use(errorMiddleware);

module.exports = app;