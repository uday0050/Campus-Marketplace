const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

export const get = (endpoint) => request(endpoint);
export const post = (endpoint, body) =>
  request(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const del = (endpoint) => request(endpoint, { method: 'DELETE' });
