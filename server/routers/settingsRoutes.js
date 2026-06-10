const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');

router.get('/', settingsController.getSettings);
router.put('/', authMiddleware, settingsController.updateSettings);

module.exports = router;
