const { generateFromImage } = require('../services/aiService');

const generateDescription = async (req, res, next) => {
  try {
    const { imageUrl, category } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    const result = await generateFromImage(imageUrl, category || null);

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateDescription };
