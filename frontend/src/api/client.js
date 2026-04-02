import axios from 'axios';

// In production, VITE_API_URL is set to the Render backend URL.
// In dev, falls back to /api which is proxied by Vite to localhost:8000.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export { API_BASE };
export default api;
