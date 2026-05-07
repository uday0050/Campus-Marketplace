const mongoose = require('mongoose');

const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Marketplace API is running',
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
