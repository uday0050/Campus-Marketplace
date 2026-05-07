const express = require('express');
const {
  createListing,
  getAllListings,
  getListingById,
  deleteListing,
} = require('../controllers/listingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllListings);
router.get('/:id', getListingById);
router.post('/', protect, createListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;
