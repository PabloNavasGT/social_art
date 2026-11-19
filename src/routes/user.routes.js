const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/:userId/follow', verifyToken, userController.toggleFollow);
router.patch('/commissions/toggle', verifyToken, userController.toggleCommissions);

module.exports = router;