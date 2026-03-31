const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|webp/;
    const isValid = allowedTypes.test(file.mimetype);

    if (!isValid) {
        return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024
    },
    fileFilter
});

module.exports = upload;
