const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');

router.get('/', eventController.getAll);
router.get('/:id', eventController.getById);
router.post('/', authMiddleware, eventController.create);
router.put('/:id', authMiddleware, eventController.update);
router.delete('/:id', authMiddleware, eventController.delete);

module.exports = router;
