const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/auth');

router.get('/', mediaController.getAll);
router.post('/upload', authMiddleware, mediaController.uploadMiddleware, mediaController.upload);
router.delete('/:id', authMiddleware, mediaController.delete);

module.exports = router;
