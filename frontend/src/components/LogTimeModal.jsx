import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import api from '../api/axios';

export default function LogTimeModal({ tasks = [], onClose, onLogged }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    taskId: tasks.length > 0 ? String(tasks[0].id) : '',
    hours:  '',
    date:   today,
    note:   '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    const h = parseFloat(form.hours);
    if (!form.taskId) { setError('Please select a task.'); return; }
    if (!h || h <= 0 || h > 24) { setError('Hours must be between 0.5 and 24.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/timelogs', {
        taskId: Number(form.taskId),
        hours:  h,
        date:   form.date || null,
        note:   form.note.trim() || null,
      });
      onLogged?.(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--color-primary)" /> Log time
          </span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-field">
            <label className="form-label">Task</label>
            {tasks.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                No tasks available to log time against.
              </p>
            ) : (
              <select className="input" value={form.taskId} onChange={set('taskId')} required>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}{t.projectName ? ` · ${t.projectName}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-field">
              <label className="form-label">Hours spent</label>
              <input
                className="input"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={form.hours}
                onChange={set('hours')}
                placeholder="e.g. 1.5"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={set('date')}
                max={today}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">
              Note <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="input"
              rows={3}
              value={form.note}
              onChange={set('note')}
              placeholder="What did you work on?"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || tasks.length === 0}>
              {loading ? 'Saving…' : 'Log time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
