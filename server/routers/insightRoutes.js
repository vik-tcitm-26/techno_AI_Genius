const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const authMiddleware = require('../middleware/auth');

router.get('/', insightController.getAll);
router.get('/:id', insightController.getById);
router.post('/', authMiddleware, insightController.create);
router.put('/:id', authMiddleware, insightController.update);
router.delete('/:id', authMiddleware, insightController.delete);

module.exports = router;
