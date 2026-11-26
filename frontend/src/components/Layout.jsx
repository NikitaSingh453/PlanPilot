import { NavLink, useNavigate } from 'react-router-dom';
import { Send, LayoutDashboard, CheckSquare, Calendar, BarChart2, Settings, LogOut, FolderKanban, Users, Bell, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifs = useCallback(() => {
    api.get('/notifications')
      .then(r => {
        setNotifs(r.data.items || []);
        setUnread(r.data.unread || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const handleMarkAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks',     label: 'Tasks',     icon: CheckSquare },
    ...(user?.role === 'MANAGER' ? [
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/team',     label: 'Team',     icon: Users },
    ] : []),
    { to: '/calendar',  label: 'Calendar',  icon: Calendar },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/settings',  label: 'Settings',  icon: Settings },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <Send size={18} strokeWidth={2} style={{ marginRight: 8, flexShrink: 0 }} />
          PlanPilot
        </div>

        <nav className="sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <item.icon size={16} style={{ flexShrink: 0 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-promo">
          <div className="sidebar-promo__text">Plan smarter,<br />achieve more!</div>
          <div className="sidebar-promo__bars">
            {[20, 32, 24, 40, 28, 36].map((h, i) => (
              <div key={i} className="sidebar-promo__bar" style={{ height: h }} />
            ))}
          </div>
        </div>

        <div className="sidebar__footer">
          <button
            className="nav-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={handleLogout}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            Logout
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="notif-btn"
              onClick={() => setShowNotifs(v => !v)}
              title="Notifications"
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-dropdown__header">
                  <span className="notif-dropdown__title">Notifications</span>
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'var(--font-medium)' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notif-dropdown__list">
                  {notifs.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item${!n.read ? ' notif-item--unread' : ''}`}
                        style={{ cursor: n.link ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (n.link) { navigate(n.link); setShowNotifs(false); }
                        }}
                      >
                        {!n.read && <div className="notif-item__dot" />}
                        <div style={{ flex: 1, paddingLeft: n.read ? 20 : 0 }}>
                          <div className="notif-item__msg">{n.message}</div>
                          <div className="notif-item__time">{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="topbar__user">
            <div className="topbar__avatar">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="topbar__name">{user?.name}</div>
              <div className="topbar__role">{user?.role}</div>
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
