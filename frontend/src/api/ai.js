import { post } from './client';

export const generateDescription = (imageUrl, category) =>
  post('/ai/generate-description', { imageUrl, category });
