// Accept the backend origin or an existing URL ending in /api.
const configuredUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE_URL = configuredUrl
  ? `${configuredUrl.replace(/\/api$/, '')}/api`
  : '/api';
export const API_ORIGIN = configuredUrl.replace(/\/api$/, '');
