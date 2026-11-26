import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import api from '../api/axios';

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const PRIORITY_DOT = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#10B981' };
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday-based, 0=Mon
}

export default function Calendar() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null); // { date, tasks }

  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  useEffect(() => {
    api.get('/tasks')
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => setView(v => {
    const d = new Date(v.year, v.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setView(v => {
    const d = new Date(v.year, v.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth  = getDaysInMonth(view.year, view.month);
  const firstWeekDay = getFirstDayOfWeek(view.year, view.month);

  const tasksByDate = {};
  tasks.forEach(t => {
    if (!t.dueDate) return;
    const key = t.dueDate; // "YYYY-MM-DD"
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(t);
  });

  const cells = [];
  for (let i = 0; i < firstWeekDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (day) => `${view.year}-${pad(view.month + 1)}-${pad(day)}`;

  const isToday = (day) =>
    day === today.getDate() &&
    view.month === today.getMonth() &&
    view.year === today.getFullYear();

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Task deadlines at a glance</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 'var(--space-5)', alignItems: 'start' }}>

        {/* Calendar grid */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
              {MONTH_NAMES[view.month]} {view.year}
            </h2>
            <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAY_HEADERS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 'var(--font-semibold)', color: 'var(--color-text-disabled)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Loading…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const key   = dateKey(day);
                const dayTasks = tasksByDate[key] || [];
                const today_ = isToday(day);
                const isSelected = selected?.key === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelected(isSelected ? null : { key, day, tasks: dayTasks })}
                    style={{
                      minHeight: 72,
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-primary-light)' : today_ ? '#EFF6FF' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'background var(--transition)',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = today_ ? '#EFF6FF' : 'var(--color-surface)'; }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: today_ ? 'var(--color-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: today_ ? 'var(--font-bold)' : 'var(--font-regular)', color: today_ ? 'white' : 'var(--color-text-primary)' }}>
                        {day}
                      </span>
                    </div>
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority], flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 'var(--font-medium)' }}>+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            {Object.entries(PRIORITY_DOT).map(([p, color]) => (
              <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {p.charAt(0) + p.slice(1).toLowerCase()} priority
              </span>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={16} color="var(--color-primary)" />
                {MONTH_NAMES[view.month]} {selected.day}
              </h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            {selected.tasks.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
                No tasks due on this day.
              </p>
            ) : selected.tasks.map(t => (
              <div key={t.id} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[t.priority], flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span className={`badge badge-${t.status.toLowerCase().replace('_', '')}`} style={{ fontSize: 10 }}>
                        {STATUS_LABEL[t.status]}
                      </span>
                      {t.projectName && (
                        <span style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>{t.projectName}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
