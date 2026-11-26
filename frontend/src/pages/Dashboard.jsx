import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, ListTodo,
  Zap, UserPlus, TrendingUp,
  Users, FolderKanban, ArrowRight, ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import AddTaskModal from '../components/AddTaskModal';
import LogTimeModal from '../components/LogTimeModal';
import api from '../api/axios';

const DAY_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MON    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekDays(fromDate) {
  const days = [];
  const dow = fromDate.getDay();
  const monday = new Date(fromDate);
  monday.setDate(fromDate.getDate() - ((dow + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const STATUS_STYLES = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };

function dueLabel(dateStr, now) {
  if (!dateStr) return { label: 'No due date', color: 'var(--color-text-disabled)' };
  const diff = Math.round((new Date(dateStr) - now) / 86400000);
  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)}d`, color: 'var(--color-error-text)' };
  if (diff === 0) return { label: 'Due today', color: 'var(--priority-medium-text)' };
  return { label: `Due in ${diff}d`, color: 'var(--color-text-secondary)' };
}

function priorityBadge(priority) {
  return {
    HIGH:   { label: 'High Priority', bg: '#FEF2F2', color: '#DC2626' },
    MEDIUM: { label: 'Medium',        bg: '#F0FDF4', color: '#16A34A' },
    LOW:    { label: 'Low',           bg: '#F3F4F6', color: '#6B7280' },
  }[priority] || { label: priority || 'None', bg: '#F3F4F6', color: '#6B7280' };
}

function StatCard({ icon: Icon, bgColor, iconColor, value, label }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color={iconColor} />
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={13} color="var(--color-text-disabled)" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', lineHeight: 1, color: 'var(--color-text-primary)' }}>{value}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Employee dashboard ───────────────────────────────────────
function EmployeeDashboard({ user, tasks, setTasks, setShowAddTask, showToast, weekSummary, onLogTime }) {
  const navigate = useNavigate();
  const now = new Date();
  const [activeDay, setActiveDay] = useState(now.getDay() === 0 ? 6 : now.getDay() - 1);
  const weekDays = getWeekDays(now);

  const overdueTasks  = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE');
  const todayTasks    = tasks.filter(t => { if (!t.dueDate) return false; return new Date(t.dueDate).toDateString() === now.toDateString() && t.status !== 'DONE'; });
  const doneTasks     = tasks.filter(t => t.status === 'DONE');
  const inProgress    = tasks.filter(t => t.status === 'IN_PROGRESS');
  const upcomingTasks = tasks
    .filter(t => t.dueDate && new Date(t.dueDate) > now && t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const hoursLogged    = weekSummary?.hoursLogged    ?? doneTasks.length * 2;
  const hoursEstimated = weekSummary?.hoursEstimated ?? Math.max(tasks.length * 2, hoursLogged + 2);

  const h12 = now.getHours() % 12 || 12;
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const dateLabel = `${DAY_SHORT[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()} · ${h12}:${mins} ${ampm}`;

  const weekTaskCounts = weekDays.reduce((acc, d, i) => {
    const count = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === d.toDateString()).length;
    if (count) acc[i] = count;
    return acc;
  }, {});

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/tasks/${id}`, { status });
      setTasks(prev => prev.map(t => t.id === id ? data : t));
    } catch { /* ignore */ }
  };

  return (
    <>
      {overdueTasks.length > 0 && (
        <div className="overdue-banner">
          <AlertCircle size={15} />
          {overdueTasks.length} task{overdueTasks.length > 1 ? 's are' : ' is'} overdue — time to clear the runway.
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's your flight plan for today. Let's make it happen!</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>
            <Clock size={14} />
            {dateLabel}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
            <Zap size={14} /> Quick add
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StatCard icon={ListTodo}    bgColor="#F5F3FF" iconColor="#7C3AED" value={tasks.length}         label="My Tasks"    />
        <StatCard icon={Clock}       bgColor="#EFF6FF" iconColor="#3B82F6" value={inProgress.length}   label="In Progress" />
        <StatCard icon={CheckCircle2} bgColor="#F0FDF4" iconColor="#16A34A" value={doneTasks.length}   label="Completed"   />
        <StatCard icon={AlertCircle} bgColor={overdueTasks.length > 0 ? '#FEF2F2' : '#FFF7ED'} iconColor={overdueTasks.length > 0 ? '#DC2626' : '#EA580C'} value={overdueTasks.length} label="Overdue" />
      </div>

      {/* Main two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Today's flight plan */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                ✈ Today's flight plan
              </h2>
              <button className="btn btn-ghost" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', padding: 'var(--space-1) var(--space-2)' }} onClick={() => navigate('/tasks')}>
                View all →
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}>
                <div style={{ width: 110, height: 130, margin: '0 auto 20px' }}>
                  <svg viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg" width="110" height="130">
                    <rect x="15" y="20" width="80" height="98" rx="8" fill="#EFF6FF"/>
                    <rect x="38" y="12" width="34" height="18" rx="9" fill="#93C5FD"/>
                    <rect x="43" y="15" width="24" height="12" rx="6" fill="#EFF6FF"/>
                    <circle cx="28" cy="52" r="7" fill="#3B82F6"/>
                    <path d="M25 52 L27.5 54.5 L31.5 49.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="40" y="48" width="38" height="6" rx="3" fill="#BFDBFE"/>
                    <circle cx="28" cy="68" r="7" fill="#3B82F6"/>
                    <path d="M25 68 L27.5 70.5 L31.5 65.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="40" y="64" width="30" height="6" rx="3" fill="#BFDBFE"/>
                    <circle cx="28" cy="84" r="7" fill="#93C5FD"/>
                    <rect x="40" y="80" width="34" height="6" rx="3" fill="#DBEAFE"/>
                    <text x="82" y="22" fontSize="14" fill="#FCD34D">✦</text>
                    <text x="90" y="36" fontSize="8" fill="#FCD34D">·</text>
                    <text x="77" y="30" fontSize="8" fill="#FCD34D">·</text>
                  </svg>
                </div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                  All clear for takeoff!
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
                  Nothing due today.
                </p>
                <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
                  + Add a task
                </button>
              </div>
            ) : todayTasks.map(task => {
              const due = dueLabel(task.dueDate, now);
              const priorityColor = { LOW: 'var(--priority-low-text)', MEDIUM: 'var(--priority-medium-text)', HIGH: 'var(--priority-high-text)' }[task.priority];
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: priorityColor }} />
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{task.title}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: due.color, whiteSpace: 'nowrap' }}>{due.label}</span>
                  <select className={`status-select ${STATUS_STYLES[task.status]}`} value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Upcoming deadlines */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>
                🚩 Upcoming deadlines
              </h2>
              <button className="btn btn-ghost" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', padding: 'var(--space-1) var(--space-2)' }} onClick={() => navigate('/tasks')}>
                View all →
              </button>
            </div>
            {upcomingTasks.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
                Nothing on the horizon yet.
              </p>
            ) : upcomingTasks.map(task => {
              const pb  = priorityBadge(task.priority);
              const due = dueLabel(task.dueDate, now);
              const dueDateStr = new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks?open=${task.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarIcon size={16} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{due.label} · {dueDateStr}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', background: pb.bg, color: pb.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {pb.label}
                  </span>
                  <ChevronRight size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* This week */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                📅 This week
              </h2>
              <button className="btn btn-ghost" style={{ fontSize: 11, color: 'var(--color-primary)', padding: 'var(--space-1)' }} onClick={() => showToast('Calendar coming soon')}>
                View calendar →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {weekDays.map((d, i) => {
                const isToday  = d.toDateString() === now.toDateString();
                const isActive = activeDay === i;
                const hasTask  = !!weekTaskCounts[i];
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 2px', borderRadius: 'var(--radius-sm)', background: isActive && !isToday ? 'var(--color-bg)' : 'transparent' }} onClick={() => setActiveDay(i)}>
                    <span style={{ fontSize: 11, color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
                      {DAY_MON[i]}
                    </span>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: isToday ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: isToday ? 'var(--font-bold)' : 'var(--font-regular)', color: isToday ? 'white' : 'var(--color-text-primary)' }}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: hasTask ? 'var(--color-primary)' : 'transparent' }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hours this week */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                📊 Hours this week
              </h2>
              <button className="btn btn-ghost" style={{ fontSize: 11, color: 'var(--color-primary)', padding: 'var(--space-1)' }} onClick={onLogTime}>
                Log time →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)' }}>
                {hoursLogged}h <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-regular)', color: 'var(--color-text-secondary)' }}>logged</span>
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{hoursEstimated.toFixed(0)}h estimated</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(Math.round((hoursLogged / hoursEstimated) * 100), 100)}%` }} />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', marginTop: 'var(--space-2)' }}>
              {Math.min(Math.round((hoursLogged / hoursEstimated) * 100), 100)}% of estimated hours used
            </div>

            {/* Recent log entries */}
            {weekSummary?.entries?.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                {weekSummary.entries.slice(0, 3).map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{e.taskTitle}</span>
                    <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)', flexShrink: 0 }}>{e.hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Motivational card */}
          <div style={{ background: '#1A2F4E', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', color: 'white', position: 'relative', overflow: 'hidden', minHeight: 100 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', marginBottom: 4 }}>You're doing great!</h3>
              <p style={{ fontSize: 'var(--text-sm)', opacity: 0.75 }}>Keep up the good work ✨</p>
            </div>
            <div style={{ position: 'absolute', right: 16, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: 4, opacity: 0.45 }}>
              {[20, 32, 24, 40, 28, 36, 30].map((h, i) => (
                <div key={i} style={{ width: 8, height: h, background: '#60A5FA', borderRadius: '3px 3px 0 0' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Manager dashboard ────────────────────────────────────────
function ManagerDashboard({ user, tasks, members, projects, showToast, onLogTime }) {
  const now = new Date();
  const dateLabel = `${DAY_SHORT[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  const overdue    = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE');
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
  const done       = tasks.filter(t => t.status === 'DONE');

  const workload = members.map(m => ({
    ...m,
    taskCount: tasks.filter(t => t.assigneeId === m.id && t.status !== 'DONE').length,
  })).sort((a, b) => b.taskCount - a.taskCount);

  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 4)
    .map(t => {
      const when = t.updatedAt || t.createdAt;
      const msAgo = when ? Date.now() - new Date(when).getTime() : null;
      let time = 'Recently';
      if (msAgo !== null) {
        const hAgo = Math.floor(msAgo / 3600000);
        const dAgo = Math.floor(msAgo / 86400000);
        time = hAgo < 1 ? 'Just now' : hAgo < 24 ? `${hAgo}h ago` : dAgo === 1 ? 'Yesterday' : `${dAgo}d ago`;
      }
      const icon   = t.status === 'DONE' ? CheckCircle2 : t.source === 'ASSIGNED' ? UserPlus : TrendingUp;
      const text   = t.status === 'DONE'
        ? `${t.assigneeName || 'Someone'} completed "${t.title}"`
        : t.source === 'ASSIGNED'
        ? `Assigned "${t.title}" to ${t.assigneeName || 'a team member'}`
        : `"${t.title}" is now ${STATUS_LABELS[t.status] || t.status}`;
      return { id: t.id, icon, text, time };
    });

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
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{dateLabel} · {members.length} team member{members.length !== 1 ? 's' : ''}, {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--color-border)' }} onClick={onLogTime}>
          <Clock size={14} /> Log time
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StatCard icon={ListTodo}    bgColor="#F5F3FF" iconColor="#7C3AED" value={tasks.length}      label="Total Tasks"  />
        <StatCard icon={Clock}       bgColor="#EFF6FF" iconColor="#3B82F6" value={inProgress.length} label="In Progress"  />
        <StatCard icon={CheckCircle2} bgColor="#F0FDF4" iconColor="#16A34A" value={done.length}      label="Completed"    />
        <StatCard icon={AlertCircle} bgColor={overdue.length > 0 ? '#FEF2F2' : '#FFF7ED'} iconColor={overdue.length > 0 ? '#DC2626' : '#EA580C'} value={overdue.length} label="Overdue" />
      </div>

      <div className="dashboard-grid">
        <div className="span-6 card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Users size={16} color="var(--color-text-secondary)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Team workload</h2>
          </div>
          {workload.length === 0
            ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No team members yet.</p>
            : workload.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
                  {m.name[0].toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{m.name}</span>
                <span className="badge badge-todo">{m.taskCount} open</span>
              </div>
            ))
          }
        </div>

        <div className="span-6 card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <FolderKanban size={16} color="var(--color-text-secondary)" />
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>Projects</h2>
          </div>
          {projects.length === 0
            ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No projects yet.</p>
            : projects.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{p.name}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>{p.ownerName}</span>
              </div>
            ))
          }
        </div>

        <div className="span-6 card">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Recent activity</h2>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
              No recent activity yet.
            </p>
          ) : recentActivity.map(item => {
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

        <div className="span-6 card">
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Overdue tasks</h2>
          {overdue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <CheckCircle2 size={24} style={{ margin: '0 auto var(--space-2)', color: 'var(--status-done-text)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>All tasks on track.</p>
            </div>
          ) : overdue.map(task => {
            const due = dueLabel(task.dueDate, now);
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

  const [tasks,       setTasks]       = useState([]);
  const [members,     setMembers]     = useState([]);
  const [projects,    setProjects]    = useState([]);
  const [weekSummary, setWeekSummary] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLogTime, setShowLogTime] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
    api.get('/timelogs/week').then(r => setWeekSummary(r.data)).catch(() => {});
    if (isManager) {
      api.get('/users').then(r => setMembers(r.data)).catch(() => {});
      api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    }
  }, [isManager]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  return (
    <div>
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onCreated={t => { setTasks(prev => [t, ...prev]); showToast('Task created'); }}
        />
      )}
      {showLogTime && (
        <LogTimeModal
          tasks={tasks}
          onClose={() => setShowLogTime(false)}
          onLogged={() => {
            api.get('/timelogs/week').then(r => setWeekSummary(r.data)).catch(() => {});
            showToast('Time logged successfully');
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}

      {isManager
        ? <ManagerDashboard user={user} tasks={tasks} members={members} projects={projects} showToast={showToast} onLogTime={() => setShowLogTime(true)} />
        : <EmployeeDashboard user={user} tasks={tasks} setTasks={setTasks} setShowAddTask={setShowAddTask} showToast={showToast} weekSummary={weekSummary} onLogTime={() => setShowLogTime(true)} />
      }
    </div>
  );
}
