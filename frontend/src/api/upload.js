const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const uploadImage = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
};
