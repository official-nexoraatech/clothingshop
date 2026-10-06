import { useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { useAuth } from '../../context/authState';
export default function RegisterPage() { const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const { register } = useAuth(); const navigate = useNavigate(); const change = (e) => setForm({ ...form, [e.target.name]: e.target.value }); const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await register(form); navigate('/customer'); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return (
    <div className="container auth-shell section-block">
      <div className="auth-card">
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
        <form className="stacked-form" onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}<input name="name" type="text" aria-label="Full name" placeholder="Full name" value={form.name} onChange={change} required />
          <input name="email" type="email" aria-label="Email" placeholder="Email" value={form.email} onChange={change} required /><input name="phone" type="tel" aria-label="Phone" placeholder="Phone" value={form.phone} onChange={change} />
          <input name="password" type="password" aria-label="Password" minLength={8} placeholder="Password (minimum 8 characters)" value={form.password} onChange={change} required /><input name="confirmPassword" type="password" aria-label="Confirm password" placeholder="Confirm password" value={form.confirmPassword} onChange={change} required />
          <button className="primary-button" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
        </form>
        <p className="auth-switch">Already a member? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

