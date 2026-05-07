const Listing = require('../models/Listing');

const SELLER_FIELDS = 'name email';

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const createListing = async (data, sellerId) =>
  Listing.create({ ...data, seller: sellerId });

const getAllListings = async (query = {}) => {
  const { category, minPrice, maxPrice, page = 1, limit = 20 } = query;

  const filter = {};
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('seller', SELLER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Listing.countDocuments(filter),
  ]);

  return { listings, total, page: Number(page), limit: Number(limit) };
};

const getListingById = async (id) => {
  const listing = await Listing.findById(id).populate('seller', SELLER_FIELDS);
  if (!listing) throw createError('Listing not found', 404);
  return listing;
};

const deleteListing = async (id, userId) => {
  const listing = await Listing.findById(id);
  if (!listing) throw createError('Listing not found', 404);
  if (listing.seller.toString() !== userId.toString()) {
    throw createError('Not authorized to delete this listing', 403);
  }
  await listing.deleteOne();
};

module.exports = { createListing, getAllListings, getListingById, deleteListing };
