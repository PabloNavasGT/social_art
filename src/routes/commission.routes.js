const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commission.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, commissionController.create);
router.get('/', verifyToken, commissionController.list);
router.patch('/:id/respond', verifyToken, commissionController.respond);
router.post('/:id/messages', verifyToken, commissionController.sendMessage);

module.exports = router;