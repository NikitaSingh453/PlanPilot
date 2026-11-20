import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-primary)',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}>
            <Compass size={28} strokeWidth={2.5} />
            PlanPilot
          </h1>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-2)',
          }}>
            Sign in to your workspace
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="alert-error" style={{ marginBottom: 'var(--space-5)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-3) var(--space-4)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{
            marginTop: 'var(--space-6)',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-medium)' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
