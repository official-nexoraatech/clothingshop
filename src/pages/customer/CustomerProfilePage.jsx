import { useState } from 'react';
import ProfileImage from '../../components/ProfileImage';
import { useAuth } from '../../context/authState';
export default function CustomerProfilePage() {
  const { user } = useAuth();
  return <ProfileForm key={user.id} />;
}
function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' }), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const save = async event => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { const saved = await updateProfile(form); setForm({ name: saved.name, phone: saved.phone || '' }); setNotice('Profile updated.'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <div className="page-content container-inner"><section className="panel-card"><h3>Personal Information</h3>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <form className="stacked-form two-col-form" onSubmit={save}>
      <label>Full name<input name="name" required minLength={2} maxLength={100} value={form.name} disabled={busy} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label>Email<input type="email" value={user.email} readOnly /></label>
      <label>Phone<input name="phone" type="tel" maxLength={20} value={form.phone} disabled={busy} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
      <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form></section><ProfileImage /></div>;
}
