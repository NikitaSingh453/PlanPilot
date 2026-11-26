import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS   = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS    = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];

export default function EditTaskModal({ task, users = [], projects = [], isManager, onClose, onUpdated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title:       task.title       ?? '',
    description: task.description ?? '',
    status:      task.status      ?? 'TODO',
    priority:    task.priority    ?? 'MEDIUM',
    dueDate:     task.dueDate     ?? '',
    assigneeId:  task.assigneeId  ?? '',
    projectId:   task.projectId   ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [comments,     setComments]     = useState([]);
  const [commentText,  setCommentText]  = useState('');
  const [commenting,   setCommenting]   = useState(false);

  const canEditMeta = isManager || task.source === 'SELF';

  useEffect(() => {
    api.get(`/tasks/${task.id}/comments`)
      .then(r => setComments(r.data))
      .catch(() => {});
  }, [task.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { status: form.status };
      if (canEditMeta) {
        payload.title       = form.title;
        payload.description = form.description || null;
        payload.priority    = form.priority;
        payload.dueDate     = form.dueDate || null;
        if (form.projectId)  payload.projectId  = Number(form.projectId);
      }
      if (isManager && form.assigneeId) {
        payload.assigneeId = Number(form.assigneeId);
      }
      const { data } = await api.patch(`/tasks/${task.id}`, payload);
      onUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const { data } = await api.post(`/tasks/${task.id}/comments`, { content: commentText.trim() });
      setComments(prev => [...prev, data]);
      setCommentText('');
    } catch {
      // silent
    } finally {
      setCommenting(false);
    }
  };

  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal__header">
          <span className="modal__title">Edit task</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

          <form id="edit-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {canEditMeta && (
              <div className="form-field">
                <label className="form-label">Title</label>
                <input className="input" value={form.title} onChange={set('title')} required />
              </div>
            )}

            {canEditMeta && (
              <div className="form-field">
                <label className="form-label">
                  Description <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea className="input" rows={3} value={form.description} onChange={set('description')} style={{ resize: 'vertical' }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={set('status')}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              {canEditMeta && (
                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select className="input" value={form.priority} onChange={set('priority')}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              )}
            </div>

            {canEditMeta && (
              <div className="form-field">
                <label className="form-label">
                  Due date <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
              </div>
            )}

            {isManager && users.length > 0 && (
              <div className="form-field">
                <label className="form-label">Assignee</label>
                <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                  <option value="">— keep current —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            {canEditMeta && projects.length > 0 && (
              <div className="form-field">
                <label className="form-label">Project <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400 }}>(optional)</span></label>
                <select className="input" value={form.projectId} onChange={set('projectId')}>
                  <option value="">— none —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </form>

          {/* Comments */}
          <div className="comment-thread">
            <div className="comment-thread__title">Comments {comments.length > 0 && `(${comments.length})`}</div>

            {comments.length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', marginBottom: 'var(--space-3)' }}>
                No comments yet. Be the first!
              </p>
            )}

            {comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar">{initials(c.authorName)}</div>
                <div className="comment-bubble">
                  <div className="comment-meta">
                    <strong>{c.authorName}</strong> · {fmtTime(c.createdAt)}
                  </div>
                  <div className="comment-text">{c.content}</div>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <input
                className="input"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={commenting}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={commenting || !commentText.trim()}
                style={{ flexShrink: 0 }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="edit-form" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
