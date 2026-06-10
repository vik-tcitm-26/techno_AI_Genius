const express = require('express');
const router = express.Router();
const podcastController = require('../controllers/podcastController');
const authMiddleware = require('../middleware/auth');

router.get('/', podcastController.getAll);
router.get('/:id', podcastController.getById);
router.post('/', authMiddleware, podcastController.create);
router.put('/:id', authMiddleware, podcastController.update);
router.delete('/:id', authMiddleware, podcastController.delete);

module.exports = router;
