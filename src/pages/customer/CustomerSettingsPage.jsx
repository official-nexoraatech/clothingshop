import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authState';
export default function CustomerSettingsPage() {
  const { user, logout, updatePreferences } = useAuth();
  const [preferences, setPreferences] = useState(user.notificationPreferences || { email: false, sms: false });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const save = async event => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { const saved = await updatePreferences(preferences); setPreferences(saved.notificationPreferences); setNotice('Contact preferences saved.'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <div className="page-content container-inner"><section className="panel-card"><h3>Account settings</h3>
    <form className="stacked-form" onSubmit={save}><h4>Contact preferences</h4><p>Choose how the shop may contact you. Your in-app notifications remain available.</p>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      <label className="check-line settings-option"><input name="email" type="checkbox" checked={preferences.email} disabled={busy} onChange={e => setPreferences({ ...preferences, email: e.target.checked })} /><span>Email updates</span></label>
      <label className="check-line settings-option"><input name="sms" type="checkbox" checked={preferences.sms} disabled={busy} onChange={e => setPreferences({ ...preferences, sms: e.target.checked })} /><span>SMS updates</span></label>
      <p>These choices record your consent; they do not subscribe you to an automated messaging service.</p>
      <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
    </form><div className="list-stack"><Link to="/forgot-password">Reset password</Link><Link to="/customer/notifications">View account notifications</Link><button className="secondary-button" onClick={logout}>Logout</button></div></section></div>;
}
