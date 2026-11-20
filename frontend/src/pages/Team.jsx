import { useState, useEffect } from 'react';
import { Users, X, Mail } from 'lucide-react';
import api from '../api/axios';

const ROLE_COLORS = {
  MANAGER: { color: 'var(--status-inreview-text)', bg: 'var(--status-inreview-bg)' },
  EMPLOYEE: { color: 'var(--status-inprogress-text)', bg: 'var(--status-inprogress-bg)' },
};

function AddMemberModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/users', form);
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title">Add team member</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Full name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Smith"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Temporary password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="They can change it later"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/users')
      .then(r => setMembers(r.data))
      .catch(() => setError('Could not load team. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {showModal && (
        <AddMemberModal
          onClose={() => setShowModal(false)}
          onAdded={m => setMembers(prev => [...prev, m])}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add member</button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Loading team…
        </div>
      ) : members.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Users size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-text-disabled)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            No team members yet. Invite people to get started.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--color-primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', flexShrink: 0,
                      }}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 'var(--font-medium)' }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Mail size={13} />
                      {m.email}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      color: ROLE_COLORS[m.role]?.color,
                      background: ROLE_COLORS[m.role]?.bg,
                    }}>
                      {m.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
