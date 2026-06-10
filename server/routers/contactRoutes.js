const express = require('express');
const router = express.Router();
const { validateContact } = require('../middleware/validation');
const { submitContact, getContacts } = require('../controllers/contactController');

router.post('/', validateContact, submitContact);
router.get('/', getContacts);

module.exports = router;
