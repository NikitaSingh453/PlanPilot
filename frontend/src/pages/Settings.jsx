import { useState } from 'react';
import { User, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, login } = useAuth();

  // Profile form
  const [name,         setName]         = useState(user?.name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,   setProfileMsg]   = useState(null); // { type: 'success'|'error', text }

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving]  = useState(false);
  const [pwMsg,    setPwMsg]     = useState(null);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.patch('/users/me', { name: name.trim() });
      setProfileMsg({ type: 'success', text: 'Name updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setPwSaving(true);
    try {
      await api.patch('/users/me', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const msgStyle = (type) => ({
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    marginBottom: 'var(--space-4)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    ...(type === 'success'
      ? { background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }
      : { background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', color: 'var(--color-error-text)' }),
  });

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      {/* Profile */}
      <Section title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} /> Profile</span>}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 'var(--font-semibold)' }}>{user?.name}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
              {user?.role?.toLowerCase()}
            </div>
          </div>
        </div>

        {profileMsg && (
          <div style={msgStyle(profileMsg.type)}>
            {profileMsg.type === 'success' && <CheckCircle2 size={15} />}
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="input" value={user?.email ?? ''} disabled style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', cursor: 'not-allowed' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', marginTop: 4 }}>Email cannot be changed.</span>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={profileSaving || name.trim() === user?.name}>
              {profileSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={16} /> Change password</span>}>
        {pwMsg && (
          <div style={msgStyle(pwMsg.type)}>
            {pwMsg.type === 'success' && <CheckCircle2 size={15} />}
            {pwMsg.text}
          </div>
        )}
        <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Current password</label>
            <input className="input" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required placeholder="••••••••" />
          </div>
          <div className="form-field">
            <label className="form-label">New password</label>
            <input className="input" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required placeholder="At least 6 characters" />
          </div>
          <div className="form-field">
            <label className="form-label">Confirm new password</label>
            <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required placeholder="Repeat new password" />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}>
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </Section>

      {/* Account info */}
      <Section title="Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            { label: 'Role',    value: user?.role?.charAt(0) + user?.role?.slice(1)?.toLowerCase() },
            { label: 'Account', value: 'Active' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
              <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
