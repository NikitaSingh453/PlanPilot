import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';

export default function AddTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/tasks/self', {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title">New personal task</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Description{' '}
              <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add more detail…"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-field">
              <label className="form-label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">
                Due date{' '}
                <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
