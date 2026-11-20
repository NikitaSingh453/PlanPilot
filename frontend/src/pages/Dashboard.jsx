import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, Clock, AlertCircle, ListTodo,
  Zap, MessageSquare, UserPlus, TrendingUp, LogIn,
  Users, FolderKanban,
} from 'lucide-react';
import AddTaskModal from '../components/AddTaskModal';
import api from '../api/axios';

const today = new Date();
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekDays() {
  const days = [];
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const STATUS_STYLES  = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const STATUS_LABELS  = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const PRIORITY_COLORS = { LOW: 'var(--priority-low-text)', MEDIUM: 'var(--priority-medium-text)', HIGH: 'var(--priority-high-text)' };

function dueLabel(dateStr) {
  if (!dateStr) return { label: 'No due date', color: 'var(--color-text-disabled)' };
  const diff = Math.round((new Date(dateStr) - today) / 86400000);
  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)}d`, color: 'var(--color-error-text)' };
  if (diff === 0) return { label: 'Due today', color: 'var(--priority-medium-text)' };
  return { label: `Due in ${diff}d`, color: 'var(--color-text-secondary)' };
}

// ─── Shared stat card ────────────────────────────────────────
function StatCard({ icon: Icon, iconColor, value, label, trend, trendColor }) {
  return (
    <div className="span-3 card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Icon size={18} color={iconColor} />
        {trend && <span style={{ fontSize: 'var(--text-xs)', color: trendColor }}>{trend}</span>}
      </div>
      <div className="num" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: iconColor !== 'var(--color-text-secondary)' ? iconColor : 'var(--color-text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</div>
    </div>
  );
}

// ─── Employee dashboard ───────────────────────────────────────
function EmployeeDashboard({ user, tasks, setTasks, showAddTask, setShowAddTask, showToast }) {
  const [activeDay, setActiveDay] = useState(today.getDay() === 0 ? 6 : today.getDay() - 1);
  const weekDays = getWeekDays();

  const overdueTasks  = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'DONE');
  const todayTasks    = tasks.filter(t => { if (!t.dueDate) return false; const d = new Date(t.dueDate); return d.toDateString() === today.toDateString() && t.status !== 'DONE'; });
  const doneTasks     = tasks.filter(t => t.status === 'DONE');
  const inProgress    = tasks.filter(t => t.status === 'IN_PROGRESS');
  const hoursLogged   = 14;
  const hoursEstimated = 32;
  const dateLabel     = `${DAY_LABELS[today.getDay()]}, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/tasks/${id}`, { status });
      setTasks(prev => prev.map(t => t.id === id ? data : t));
    } catch { /* ignore */ }
  };

  const weekTaskCounts = weekDays.reduce((acc, d, i) => {
    const count = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === d.toDateString()).length;
    if (count) acc[i] = count;
    return acc;
  }, {});

  return (
    <>
      {overdueTasks.length > 0 && (
        <div className="overdue-banner">
          <AlertCircle size={15} />
          {overdueTasks.length} task{overdueTasks.length > 1 ? 's are' : ' is'} overdue — time to clear the runway.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">{dateLabel} · {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} on today's flight plan</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }} onClick={() => showToast('Time logging coming soon')}>
            <Clock size={14} /> Log time
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
            <Zap size={14} /> Quick add
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <StatCard icon={ListTodo}    iconColor="var(--color-text-secondary)"    value={tasks.length}      label="My Tasks"    trend={null} />
        <StatCard icon={Clock}       iconColor="var(--status-inprogress-text)"  value={inProgress.length} label="In Progress" trend="same as last week" trendColor="var(--color-text-disabled)" />
        <StatCard icon={CheckCircle2} iconColor="var(--status-done-text)"       value={doneTasks.length}  label="Completed"   trend="+1 vs last week"  trendColor="var(--status-done-text)" />
        <StatCard icon={AlertCircle} iconColor={overdueTasks.length > 0 ? 'var(--color-error-text)' : 'var(--color-text-secondary)'} value={overdueTasks.length} label="Overdue" trend={overdueTasks.length > 0 ? 'needs attention' : 'all clear'} trendColor={overdueTasks.length > 0 ? 'var(--color-error-text)' : 'var(--status-done-text)'} />

        {/* Today's flight plan */}
        <div className="span-8 card">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Today's flight plan</h2>
          {todayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--status-done-text)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Cleared for takeoff — nothing due today.</p>
            </div>
          ) : todayTasks.map(task => {
            const due = dueLabel(task.dueDate);
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: PRIORITY_COLORS[task.priority] }} />
                <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{task.title}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: due.color, whiteSpace: 'nowrap' }}>{due.label}</span>
                <select className={`status-select ${STATUS_STYLES[task.status]}`} value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            );
          })}
        </div>

        {/* Week strip + hours */}
        <div className="span-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>This week</h2>
            <div className="week-strip">
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const count = weekTaskCounts[i] || 0;
                return (
                  <div key={i} className={`week-day${activeDay === i ? ' active' : ''}${isToday ? ' today' : ''}${count > 0 ? ' has-tasks' : ''}`} onClick={() => setActiveDay(i)}>
                    <span className="week-day__label">{DAY_LABELS[(i + 1) % 7]}</span>
                    <span className="week-day__dot">{count > 0 ? count : ''}</span>
                    <span className="week-day__date">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>Hours this week</h2>
              <button className="btn btn-ghost" style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }} onClick={() => showToast('Time logging coming soon')}>Log time</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span className="num" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{hoursLogged}h logged</span>
              <span className="num" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{hoursEstimated}h estimated</span>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round((hoursLogged / hoursEstimated) * 100)}%` }} /></div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', marginTop: 'var(--space-2)' }}>{Math.round((hoursLogged / hoursEstimated) * 100)}% of estimated hours used</div>
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="span-12 card">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Upcoming deadlines</h2>
          {tasks.filter(t => t.dueDate && new Date(t.dueDate) > today && t.status !== 'DONE').length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <LogIn size={24} style={{ margin: '0 auto var(--space-2)', opacity: 0.4 }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Nothing on the horizon yet.</p>
            </div>
          ) : tasks.filter(t => t.dueDate && new Date(t.dueDate) > today && t.status !== 'DONE').map(task => {
            const due = dueLabel(task.dueDate);
            return (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 'var(--text-sm)' }}>{task.title}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: due.color }}>{due.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Manager dashboard ────────────────────────────────────────
function ManagerDashboard({ user, tasks, members, projects, showToast }) {
  const dateLabel = `${DAY_LABELS[today.getDay()]}, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;
  const overdue   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'DONE');
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
  const done      = tasks.filter(t => t.status === 'DONE');

  // Tasks grouped by assignee for workload view
  const workload = members.map(m => ({
    ...m,
    taskCount: tasks.filter(t => t.assigneeId === m.id && t.status !== 'DONE').length,
  })).sort((a, b) => b.taskCount - a.taskCount);

  const mockActivity = [
    { id: 1, icon: UserPlus,      text: 'You assigned Fix login bug to Priya',    time: '2h ago' },
    { id: 2, icon: CheckCircle2,  text: 'Ravi completed Write API docs',           time: '4h ago' },
    { id: 3, icon: TrendingUp,    text: 'Sprint 3 started',                        time: 'Yesterday' },
    { id: 4, icon: MessageSquare, text: 'New comment on Update onboarding flow',   time: 'Yesterday' },
  ];

  return (
    <>
      {overdue.length > 0 && (
        <div className="overdue-banner">
          <AlertCircle size={15} />
          {overdue.length} task{overdue.length > 1 ? 's are' : ' is'} overdue across your team.
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">{dateLabel} · {members.length} team member{members.length !== 1 ? 's' : ''}, {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }} onClick={() => showToast('Time logging coming soon')}>
          <Clock size={14} /> Log time
        </button>
      </div>

      <div className="dashboard-grid">
        <StatCard icon={ListTodo}    iconColor="var(--color-text-secondary)"   value={tasks.length}      label="Total Tasks"  trend={null} />
        <StatCard icon={Clock}       iconColor="var(--status-inprogress-text)" value={inProgress.length} label="In Progress"  trend={null} />
        <StatCard icon={CheckCircle2} iconColor="var(--status-done-text)"      value={done.length}       label="Completed"    trend={null} />
        <StatCard icon={AlertCircle} iconColor={overdue.length > 0 ? 'var(--color-error-text)' : 'var(--color-text-secondary)'} value={overdue.length} label="Overdue" trend={overdue.length > 0 ? 'needs attention' : 'all clear'} trendColor={overdue.length > 0 ? 'var(--color-error-text)' : 'var(--status-done-text)'} />

        {/* Team workload */}
        <div className="span-6 card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Users size={16} color="var(--color-text-secondary)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Team workload</h2>
          </div>
          {workload.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No team members yet.</p>
          ) : workload.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
                {m.name[0].toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{m.name}</span>
              <span className="badge badge-todo">{m.taskCount} open</span>
            </div>
          ))}
        </div>

        {/* Projects overview */}
        <div className="span-6 card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <FolderKanban size={16} color="var(--color-text-secondary)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Projects</h2>
          </div>
          {projects.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No projects yet.</p>
          ) : projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{p.name}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>{p.ownerName}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="span-6 card">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Recent activity</h2>
          {mockActivity.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="activity-item">
                <div className="activity-icon"><Icon size={13} /></div>
                <div>
                  <div className="activity-text">{item.text}</div>
                  <div className="activity-time">{item.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue tasks */}
        <div className="span-6 card">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Overdue tasks</h2>
          {overdue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <CheckCircle2 size={24} style={{ margin: '0 auto var(--space-2)', color: 'var(--status-done-text)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>All tasks on track.</p>
            </div>
          ) : overdue.map(task => {
            const due = dueLabel(task.dueDate);
            return (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{task.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>{task.assigneeName}</div>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: due.color }}>{due.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [tasks,    setTasks]    = useState([]);
  const [members,  setMembers]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
    if (isManager) {
      api.get('/users').then(r => setMembers(r.data)).catch(() => {});
      api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    }
  }, [isManager]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  return (
    <div>
      {showAddTask && <AddTaskModal onClose={() => setShowAddTask(false)} onCreated={t => { setTasks(prev => [t, ...prev]); showToast('Task created'); }} />}
      {toast && <div className="toast">{toast}</div>}

      {isManager
        ? <ManagerDashboard user={user} tasks={tasks} members={members} projects={projects} showToast={showToast} />
        : <EmployeeDashboard user={user} tasks={tasks} setTasks={setTasks} showAddTask={showAddTask} setShowAddTask={setShowAddTask} showToast={showToast} />
      }
    </div>
  );
}
