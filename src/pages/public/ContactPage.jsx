import { useState } from 'react';
import { useShop } from '../../context/shopState';
import { useAuth } from '../../context/authState';
export default function ContactPage() {
  const { settings } = useShop(), { request } = useAuth();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const submit = async event => { event.preventDefault(); if (busy) return; const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); setBusy(true); setError(''); setNotice(''); try { const result = await request('/contact', { method: 'POST', body: JSON.stringify(body) }); form.reset(); setNotice(result.message); } catch (failure) { setError(failure.message); } finally { setBusy(false); } };
  return <div className="container section-block contact-page"><div className="contact-grid"><div className="contact-form-card"><p className="eyebrow">Contact us</p><h1>We would love to hear from you.</h1><form className="stacked-form" onSubmit={submit}>
    {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    <label>Name<input name="name" required maxLength={100} /></label><label>Email<input name="email" type="email" required maxLength={254} /></label><label>Phone<input name="phone" type="tel" maxLength={25} /></label><label>Subject<input name="subject" required maxLength={200} /></label><label>Message<textarea name="message" required maxLength={5000} rows={5} /></label><button className="primary-button" disabled={busy}>{busy ? 'Sending…' : 'Submit'}</button></form></div><div className="info-card"><h3>Business info</h3>{settings ? <p>{settings.name}<br />{settings.location}<br />{settings.email}<br />{settings.phone}</p> : <p>Shop contact information is currently unavailable.</p>}</div></div></div>;
}
