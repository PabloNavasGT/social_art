const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artwork.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { uploadMedia } = require('../middlewares/upload.middleware');

router.get('/feed', verifyToken, artworkController.getFeed);
router.post('/', verifyToken, uploadMedia.array('media', 10), artworkController.create);
router.get('/artist/:userId', verifyToken, artworkController.getUserGallery);

module.exports = router;