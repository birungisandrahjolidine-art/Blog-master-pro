const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Mime type => allowed file extensions
const ALLOWED_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/avif': ['.avif'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/ogg': ['.ogv', '.ogg'],
    'video/quicktime': ['.mov'],
    'video/x-matroska': ['.mkv']
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const allowedExts = ALLOWED_TYPES[file.mimetype] || [];
        const originalExt = path.extname(file.originalname).toLowerCase();
        const ext = allowedExts.includes(originalExt) ? originalExt : allowedExts[0] || '';
        const unique = crypto.randomBytes(8).toString('hex');
        cb(null, `${Date.now()}-${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
        return cb(null, true);
    }
    cb(new Error('Only images (JPG, PNG, GIF, WEBP, AVIF) and videos (MP4, WEBM, OGG, MOV) can be uploaded.'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_BYTES }
});

// Wraps multer so upload problems render the form with a friendly message
const uploadMedia = (req, res, next) => {
    upload.single('media')(req, res, (err) => {
        if (!err) {
            return next();
        }

        let message = err.message || 'Could not upload that file.';

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                message = 'That file is too large. The maximum size is 50 MB.';
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                message = 'You can attach only one image or video per story.';
            }
        }

        return res.status(400).render('blogform', {
            blogs: [],
            user: req.user,
            error: message
        });
    });
};

// Builds the media object stored on the blog document
const toMediaPayload = (file) => {
    if (!file) {
        return undefined;
    }
    return {
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        originalName: file.originalname,
        size: file.size
    };
};

// Removes an uploaded file (used when the blog is deleted)
const removeUpload = (url) => {
    if (!url || !url.startsWith('/uploads/')) {
        return;
    }
    const filePath = path.join(UPLOAD_DIR, path.basename(url));
    fs.promises.unlink(filePath).catch(() => {});
};

module.exports = { uploadMedia, toMediaPayload, removeUpload, MAX_SIZE_BYTES };
