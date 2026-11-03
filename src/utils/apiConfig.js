// Development uses Vite's same-origin proxy; production calls the established
// Render API when VITE_API_URL has not been supplied at build time.
const DEFAULT_API_ORIGIN = 'https://clothingshop-fafa.onrender.com';
const configuredUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : DEFAULT_API_ORIGIN)).trim().replace(/\/+$/, '');
export const API_BASE_URL = configuredUrl
  ? `${configuredUrl.replace(/\/api$/, '')}/api`
  : '/api';
export const API_ORIGIN = configuredUrl.replace(/\/api$/, '');
