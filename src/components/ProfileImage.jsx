import { useState } from 'react';
import { useAuth } from '../context/authState';
export default function ProfileImage() {
  const { user, uploadAvatar } = useAuth();
  const [file, setFile] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const save = async event => {
    event.preventDefault(); if (!file || busy) return;
    if (file.size > 5 * 1024 * 1024) { setError('Choose an image no larger than 5 MB.'); return; }
    const form = event.currentTarget;
    setBusy(true); setError(''); setNotice('');
    try { await uploadAvatar(file); setFile(null); form.reset(); setNotice('Profile image updated.'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <section className="panel-card"><h3>Profile image</h3>
    {user.avatar && <img className="profile-avatar" src={user.avatar} alt="Your profile" />}
    <form className="stacked-form" onSubmit={save}>
      <label>Choose profile image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={e => { setFile(e.target.files?.[0] || null); setError(''); setNotice(''); }} /></label>
      <p>JPEG, PNG, WebP or GIF, up to 5 MB.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <button className="primary-button" disabled={!file || busy}>{busy ? 'Uploading...' : 'Upload profile image'}</button>
    </form>
  </section>;
}
