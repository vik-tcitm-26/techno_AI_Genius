const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');

router.get('/', videoController.getAll);
router.get('/:id', videoController.getById);
router.post('/', authMiddleware, videoController.create);
router.put('/:id', authMiddleware, videoController.update);
router.delete('/:id', authMiddleware, videoController.delete);

module.exports = router;
