const express = require('express');
const router = express.Router();
const { validateNewsletter } = require('../middleware/validation');
const { subscribe, getSubscribers } = require('../controllers/newsletterController');

router.post('/subscribe', validateNewsletter, subscribe);
router.get('/', getSubscribers);

module.exports = router;
