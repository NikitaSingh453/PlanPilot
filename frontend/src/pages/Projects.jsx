import { useState, useEffect } from 'react';
import { FolderKanban, X, Trash2 } from 'lucide-react';
import api from '../api/axios';

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title">New project</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Project name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website redesign"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="form-label">
              Description <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => setError('Could not load projects. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      // silently ignore
    }
  };

  return (
    <div>
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track all team projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New project</button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <FolderKanban size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-text-disabled)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            No projects yet. Projects will appear here once created.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {projects.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <FolderKanban size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)' }}>{p.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error-text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-disabled)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {p.description && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{p.description}</p>
              )}
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', marginTop: 'var(--space-2)' }}>
                Created by {p.ownerName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
