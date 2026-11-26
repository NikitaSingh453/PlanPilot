import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, ListTodo, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_COLORS = {
  TODO:        { bg: '#EFF6FF', text: '#3B82F6' },
  IN_PROGRESS: { bg: '#FFF7ED', text: '#F97316' },
  IN_REVIEW:   { bg: '#F5F3FF', text: '#7C3AED' },
  DONE:        { bg: '#F0FDF4', text: '#16A34A' },
};
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const PRIORITY_COLORS = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#10B981' };

function DonutChart({ segments, size = 120 }) {
  const r = 40, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth="18" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-text-secondary)">0</text>
    </svg>
  );
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const pct    = seg.value / total;
        const dash   = pct * circumference;
        const gap    = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="700"
            fill="var(--color-text-primary)" style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
        {total}
      </text>
    </svg>
  );
}

function HBar({ label, value, max, color }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
      <div style={{ width: 70, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: 'var(--color-bg)', borderRadius: 'var(--radius-full)', height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ width: 24, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>{value}</div>
    </div>
  );
}

function StatTile({ icon: Icon, bg, iconColor, value, label }) {
  return (
    <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [tasks,   setTasks]   = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reqs = [api.get('/tasks')];
    if (isManager) reqs.push(api.get('/users'));
    Promise.all(reqs)
      .then(([t, u]) => { setTasks(t.data); if (u) setMembers(u.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isManager]);

  if (loading) return (
    <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
      Loading analytics…
    </div>
  );

  const now     = new Date();
  const done    = tasks.filter(t => t.status === 'DONE');
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE');
  const inProg  = tasks.filter(t => t.status === 'IN_PROGRESS');
  const compPct = tasks.length === 0 ? 0 : Math.round((done.length / tasks.length) * 100);

  const statusSegs = Object.entries(STATUS_LABEL).map(([k, label]) => ({
    label,
    value: tasks.filter(t => t.status === k).length,
    color: STATUS_COLORS[k].text,
  }));

  const maxStatus = Math.max(...statusSegs.map(s => s.value), 1);

  const priorityCounts = {
    HIGH:   tasks.filter(t => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
    LOW:    tasks.filter(t => t.priority === 'LOW').length,
  };
  const maxPriority = Math.max(...Object.values(priorityCounts), 1);

  // Last 7 days completion trend
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: tasks.filter(t => t.dueDate === key && t.status === 'DONE').length,
    };
  });
  const maxTrend = Math.max(...trend.map(d => d.count), 1);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Performance overview based on your task data</p>
        </div>
      </div>

      {/* Top stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <StatTile icon={ListTodo}    bg="#F5F3FF" iconColor="#7C3AED" value={tasks.length}  label="Total Tasks" />
        <StatTile icon={CheckCircle2} bg="#F0FDF4" iconColor="#16A34A" value={done.length}  label="Completed"   />
        <StatTile icon={Clock}       bg="#EFF6FF" iconColor="#3B82F6" value={inProg.length} label="In Progress" />
        <StatTile icon={AlertCircle} bg={overdue.length > 0 ? '#FEF2F2' : '#FFF7ED'}
                                     iconColor={overdue.length > 0 ? '#EF4444' : '#F97316'}
                                     value={overdue.length} label="Overdue" />
      </div>

      {/* Completion rate banner */}
      <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <TrendingUp size={18} color="var(--color-primary)" />
          <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-base)' }}>Completion rate</span>
        </div>
        <div style={{ flex: 1 }}>
          <div className="progress-track" style={{ height: 10 }}>
            <div className="progress-fill" style={{ width: `${compPct}%`, transition: 'width 0.6s ease' }} />
          </div>
        </div>
        <div style={{ flexShrink: 0, fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', color: compPct >= 70 ? '#16A34A' : compPct >= 40 ? 'var(--color-primary)' : '#F97316' }}>
          {compPct}%
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>

        {/* Status breakdown donut */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-5)' }}>Tasks by status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            <DonutChart segments={statusSegs} size={120} />
            <div style={{ flex: 1 }}>
              {statusSegs.map(s => (
                <HBar key={s.label} label={s.label} value={s.value} max={maxStatus} color={s.color} />
              ))}
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-5)' }}>Tasks by priority</h3>
          <div style={{ marginTop: 'var(--space-4)' }}>
            {Object.entries(priorityCounts).map(([p, count]) => (
              <HBar key={p} label={p.charAt(0) + p.slice(1).toLowerCase()} value={count} max={maxPriority} color={PRIORITY_COLORS[p]} />
            ))}
          </div>
          <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            {Object.entries(priorityCounts).map(([p, count]) => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[p] }} />
                  {p.charAt(0) + p.slice(1).toLowerCase()} priority
                </span>
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>
                  {tasks.length === 0 ? 0 : Math.round((count / tasks.length) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-day completion trend */}
      <div className="card" style={{ marginBottom: isManager ? 'var(--space-5)' : 0 }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-5)' }}>Tasks completed — last 7 days</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: 100 }}>
          {trend.map((d, i) => {
            const h = maxTrend === 0 ? 0 : Math.round((d.count / maxTrend) * 80);
            const isLast = i === trend.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
                  {d.count > 0 ? d.count : ''}
                </div>
                <div style={{
                  width: '100%', height: Math.max(h, 4),
                  background: isLast ? 'var(--color-primary)' : 'var(--color-primary-light)',
                  borderRadius: '4px 4px 0 0',
                  border: isLast ? 'none' : '1px solid var(--color-primary)',
                  transition: 'height 0.4s ease',
                }} />
                <div style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manager: team workload */}
      {isManager && members.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-5)' }}>Team workload</h3>
          {members.map(m => {
            const memberTasks  = tasks.filter(t => t.assigneeId === m.id);
            const memberDone   = memberTasks.filter(t => t.status === 'DONE').length;
            const memberActive = memberTasks.length - memberDone;
            const memberPct    = memberTasks.length === 0 ? 0 : Math.round((memberDone / memberTasks.length) * 100);
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div style={{ width: 130, flexShrink: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{m.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>{memberActive} active · {memberDone} done</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${memberPct}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div style={{ width: 36, textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: memberPct >= 70 ? '#16A34A' : 'var(--color-text-secondary)', flexShrink: 0 }}>
                  {memberPct}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
