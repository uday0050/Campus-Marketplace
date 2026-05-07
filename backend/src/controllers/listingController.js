const listingService = require('../services/listingService');

const createListing = async (req, res, next) => {
  try {
    const listing = await listingService.createListing(req.body, req.user._id);
    res.status(201).json({ success: true, listing });
  } catch (err) {
    next(err);
  }
};

const getAllListings = async (req, res, next) => {
  try {
    const result = await listingService.getAllListings(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getListingById = async (req, res, next) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    res.status(200).json({ success: true, listing });
  } catch (err) {
    next(err);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    await listingService.deleteListing(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createListing, getAllListings, getListingById, deleteListing };
