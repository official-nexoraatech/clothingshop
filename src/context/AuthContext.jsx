import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './authState';
import { API_BASE_URL } from '../utils/apiConfig';

async function request(path, { responseType, ...options } = {}) {
  const token = localStorage.getItem('authToken');
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: options.signal || AbortSignal.timeout(90000), headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch (error) { throw new Error(error.name === 'TimeoutError' ? 'The request timed out. Please try again.' : 'Unable to reach the server. Please try again.'); }
  if (response.status === 401 && token && !['/auth/login', '/auth/register'].includes(path) && localStorage.getItem('authToken') === token) {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('auth-expired'));
  }
  if (response.ok && responseType === 'blob') return response.blob();
  const text = response.status === 204 ? '' : await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch {
    const error = new Error(`The request to ${path} returned a non-JSON response (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}).`);
    error.status = response.status;
    error.path = path;
    throw error;
  }
  if (!response.ok) {
    const message = typeof data.message === 'string' && data.message.trim()
      ? data.message
      : `The request to ${path} failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}).`;
    const error = new Error(message);
    error.status = response.status;
    error.path = path;
    throw error;
  }
  return data;
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const restore = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return (token ? request('/auth/me') : Promise.resolve({ user: null }))
      .then(data => { if (localStorage.getItem('authToken') === token) { setUser(data.user); setError(''); } })
      .catch(failure => setError(failure.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const expired = () => setUser(null);
    const storage = event => { if (event.key === 'authToken' || event.key === null) { setUser(null); restore(); } };
    window.addEventListener('auth-expired', expired); window.addEventListener('storage', storage);
    restore();
    return () => { window.removeEventListener('auth-expired', expired); window.removeEventListener('storage', storage); };
  }, [restore]);
  const authenticate = async (path, body) => { setError(''); const data = await request(path, { method: 'POST', body: JSON.stringify(body) }); localStorage.setItem('authToken', data.token); setUser(data.user); return data.user; };
  const updateAccount = async (path, body) => {
    const token = localStorage.getItem('authToken');
    const data = await request(path, { method: 'PATCH', body: JSON.stringify(body) });
    if (token && localStorage.getItem('authToken') === token) setUser(data.user);
    return data.user;
  };
  const uploadAvatar = async file => {
    const token = localStorage.getItem('authToken'), body = new FormData(); body.append('avatar', file);
    const data = await request('/auth/avatar', { method: 'POST', body });
    if (token && localStorage.getItem('authToken') === token) setUser(data.user);
    return data.user;
  };
  const logout = async () => { localStorage.removeItem('authToken'); setUser(null); setError(''); };
  return <AuthContext.Provider value={{ user, loading, error, setError, login: body => authenticate('/auth/login', body), register: body => authenticate('/auth/register', body), forgotPassword: email => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }), resetPassword: body => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }), logout, uploadAvatar, updateProfile: body => updateAccount('/auth/me', body), updatePreferences: body => updateAccount('/auth/preferences', body), request, retrySession: restore }}>{children}</AuthContext.Provider>;
}



