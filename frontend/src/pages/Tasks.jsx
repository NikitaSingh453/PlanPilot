import { useState, useEffect } from 'react';
import { Plus, ClipboardList, Trash2, List, Columns, Search, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import KanbanView from '../components/KanbanView';

const STATUS_LABELS  = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const STATUS_CLASSES = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const PRIORITY_COLORS = { LOW: 'var(--priority-low-text)', MEDIUM: 'var(--priority-medium-text)', HIGH: 'var(--priority-high-text)' };
const PAGE_SIZES = [10, 25, 50];

export default function Tasks() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks,    setTasks]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState('');

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [editingTask,   setEditingTask]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // View + filters
  const [view,      setView]      = useState('table'); // 'table' | 'kanban'
  const [search,    setSearch]    = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject,  setFilterProject]  = useState('');
  const [pageSize,  setPageSize]  = useState(10);
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    const fetches = [api.get('/tasks'), api.get('/projects')];
    if (isManager) fetches.push(api.get('/users'));

    Promise.all(fetches)
      .then(([tasksRes, projectsRes, usersRes]) => {
        const loadedTasks = tasksRes.data;
        setTasks(loadedTasks);
        if (projectsRes?.data) setProjects(projectsRes.data);
        if (usersRes?.data)    setUsers(usersRes.data);

        const openId = searchParams.get('open');
        if (openId) {
          const target = loadedTasks.find(t => String(t.id) === openId);
          if (target) setEditingTask(target);
          setSearchParams({}, { replace: true });
        }
      })
      .catch(() => setError('Could not load data. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [isManager]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setConfirmDelete(null);
      showToast('Task deleted');
    } catch (err) {
      setConfirmDelete(null);
      showToast(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const canEdit = (task) => isManager || (task.source === 'SELF' && task.ownerId === user?.id);

  // ── Filtering ───────────────────────────────────────────
  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject  && String(t.projectId) !== filterProject) return false;
    return true;
  });

  // ── Pagination ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasFilters = search || filterStatus || filterPriority || filterProject;

  return (
    <div>
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onCreated={t => { setTasks(prev => [t, ...prev]); showToast('Task created'); }}
          users={isManager ? users : []}
          projects={projects}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          users={isManager ? users : []}
          projects={projects}
          isManager={isManager}
          onClose={() => setEditingTask(null)}
          onUpdated={updated => {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            setEditingTask(null);
            showToast('Task updated');
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            {isManager
              ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} across your team`
              : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} assigned to you`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div className="view-toggle">
            <button
              className={`view-toggle__btn${view === 'table' ? ' active' : ''}`}
              onClick={() => setView('table')}
              title="Table view"
            >
              <List size={15} />
            </button>
            <button
              className={`view-toggle__btn${view === 'kanban' ? ' active' : ''}`}
              onClick={() => setView('kanban')}
              title="Kanban view"
            >
              <Columns size={15} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> New task
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Search tasks…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input"
          style={{ flex: '0 1 140px' }}
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          className="input"
          style={{ flex: '0 1 140px' }}
          value={filterPriority}
          onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
        >
          <option value="">All priorities</option>
          {['LOW','MEDIUM','HIGH'].map(p => <option key={p} value={p}>{p.charAt(0)+p.slice(1).toLowerCase()}</option>)}
        </select>
        {projects.length > 0 && (
          <select
            className="input"
            style={{ flex: '0 1 160px' }}
            value={filterProject}
            onChange={e => { setFilterProject(e.target.value); setPage(1); }}
          >
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {hasFilters && (
          <button
            className="btn btn-ghost"
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterProject(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Loading tasks…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <ClipboardList size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--color-text-disabled)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {hasFilters ? 'No tasks match your filters.' : 'No tasks yet — add your first one above.'}
          </p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanView
          tasks={filtered}
          onTaskClick={setEditingTask}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Source</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  {isManager && <th>Assignee</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => setEditingTask(task)}
                    style={{ cursor: 'pointer', ...(editingTask?.id === task.id ? { background: 'var(--color-primary-light)' } : undefined) }}
                    onMouseEnter={e => { if (editingTask?.id !== task.id) e.currentTarget.style.background = 'var(--color-bg)'; }}
                    onMouseLeave={e => { if (editingTask?.id !== task.id) e.currentTarget.style.background = ''; }}
                  >
                    <td>
                      <div style={{ fontWeight: 'var(--font-medium)' }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {task.projectName ?? <span style={{ color: 'var(--color-text-disabled)' }}>—</span>}
                    </td>
                    <td>
                      {task.source === 'SELF'
                        ? <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>Personal</span>
                        : <span className="badge badge-todo">Assigned</span>}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{task.priority}</span>
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
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
                    {isManager && (
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {task.assigneeName}
                      </td>
                    )}
                    <td onClick={e => e.stopPropagation()}>
                      {canEdit(task) && (
                        confirmDelete === task.id ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              onClick={() => handleDelete(task.id)}
                              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error-text)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer' }}
                            >Delete</button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer' }}
                            >Cancel</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(task.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error-text)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-disabled)'}
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 || filtered.length > PAGE_SIZES[0] ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <span>
                {filtered.length === 0 ? 'No results' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <select
                  className="input"
                  style={{ width: 'auto', paddingRight: 'var(--space-6)' }}
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
                </select>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 30, height: 30, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                        background: p === safePage ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: p === safePage ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
