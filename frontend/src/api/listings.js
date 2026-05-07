import { get, post, del } from './client';

export const getListings = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/listings${query ? `?${query}` : ''}`);
};

export const getListing = (id) => get(`/listings/${id}`);
export const createListing = (data) => post('/listings', data);
export const deleteListing = (id) => del(`/listings/${id}`);
