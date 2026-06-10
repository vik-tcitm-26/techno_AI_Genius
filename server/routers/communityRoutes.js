const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, communityController.getAll);
router.post('/', communityController.create);
router.delete('/:id', authMiddleware, communityController.delete);

module.exports = router;
