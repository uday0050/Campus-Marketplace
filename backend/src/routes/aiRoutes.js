const express = require('express');
const { generateDescription } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected — only logged-in users can use AI generation
router.post('/generate-description', protect, generateDescription);

module.exports = router;
