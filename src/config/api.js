// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is missing! Check your .env files');
}

export default API_BASE_URL;