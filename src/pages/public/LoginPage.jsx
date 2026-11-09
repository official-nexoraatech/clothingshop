import { useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { useAuth } from '../../context/authState';
export default function LoginPage() { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const { login } = useAuth(); const navigate = useNavigate(); const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { const user = await login({ email, password }); navigate(`/${user.role}`); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return (
    <div className="container auth-shell section-block">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <form className="stacked-form" onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}<input type="email" aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" aria-label="Password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label className="check-line"><input type="checkbox" /> Remember me</label>
          <button className="primary-button" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
          <Link to="/forgot-password" className="text-link">Forgot password?</Link>
        </form>
        <p className="auth-switch">Need an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}

