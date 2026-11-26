import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';

export default function AddTaskModal({ onClose, onCreated, users = [], projects = [] }) {
  const [form, setForm]     = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', projectId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const isAssigning = form.assigneeId !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description || null,
        priority:    form.priority,
        dueDate:     form.dueDate || null,
        projectId:   form.projectId ? Number(form.projectId) : null,
      };
      const url = isAssigning ? `/tasks/assign/${form.assigneeId}` : '/tasks/self';
      const { data } = await api.post(url, payload);
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title">{isAssigning ? 'Assign task' : 'New personal task'}</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Title</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="What needs to be done?" required autoFocus />
          </div>

          <div className="form-field">
            <label className="form-label">
              Description <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="Add more detail…" style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-field">
              <label className="form-label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Due date <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span></label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          {users.length > 0 && (
            <div className="form-field">
              <label className="form-label">Assign to <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span></label>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">— personal task —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          {projects.length > 0 && (
            <div className="form-field">
              <label className="form-label">Project <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span></label>
              <select className="input" value={form.projectId} onChange={set('projectId')}>
                <option value="">— none —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : isAssigning ? 'Assign task' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
