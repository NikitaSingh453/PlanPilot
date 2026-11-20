import { useState, useEffect } from 'react';
import { Plus, X, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AddTaskModal from '../components/AddTaskModal';

const STATUS_LABELS  = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const STATUS_CLASSES = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const PRIORITY_COLORS = { LOW: 'var(--priority-low-text)', MEDIUM: 'var(--priority-medium-text)', HIGH: 'var(--priority-high-text)' };


export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/tasks')
      .then(r => setTasks(r.data))
      .catch(() => setError('Could not load tasks. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (task) => setTasks(prev => [task, ...prev]);

  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    } catch {
      // silently ignore — UI stays on old value
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {
      // silently ignore
    }
  };

  const canEdit = (task) =>
    user?.role === 'MANAGER' || (task.source === 'SELF' && task.ownerId === user?.id);

  return (
    <div>
      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New task
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Loading tasks…
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
            <ClipboardList size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-text-disabled)' }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No tasks yet — add your first one above.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Source</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                {user?.role === 'MANAGER' && <th>Assignee</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 'var(--font-medium)' }}>{task.title}</td>
                  <td>
                    {task.source === 'SELF' ? (
                      <span className="badge badge-inprogress" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        Personal
                      </span>
                    ) : (
                      <span className="badge badge-todo">Assigned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{task.priority}</span>
                    </span>
                  </td>
                  <td>
                    <select
                      className={`status-select ${STATUS_CLASSES[task.status]}`}
                      value={task.status}
                      onChange={e => handleStatusChange(task.id, e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {task.dueDate ?? '—'}
                  </td>
                  {user?.role === 'MANAGER' && (
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {task.assigneeName}
                    </td>
                  )}
                  <td>
                    {canEdit(task) && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--color-text-disabled)', padding: 'var(--space-1)',
                          borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-disabled)'}
                        title="Delete task"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
