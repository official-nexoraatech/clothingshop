import { useRef, useState } from 'react';
import { useAuth } from '../context/authState';
export function useAdminMutation() {
  const { request } = useAuth(), pending = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const run = async (path, options, message, after) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try { const data = await request(path, options); after?.(data); setNotice(message); }
    catch (e) { setError(e.message); }
    finally { pending.current = false; setBusy(false); }
  };
  return { run, busy, error, notice, setError, clear: () => { setError(''); setNotice(''); } };
}
