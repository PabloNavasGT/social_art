const multer = require('multer');

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y videos'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = { uploadMedia };