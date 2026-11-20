import { NavLink, useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/projects', label: 'Projects', managerOnly: true },
  { to: '/team', label: 'Team', managerOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <Compass size={20} strokeWidth={2.5} style={{ marginRight: 'var(--space-2)', flexShrink: 0 }} />
          PlanPilot
        </div>
        <nav className="sidebar__nav">
          {navItems
            .filter(item => !item.managerOnly || user?.role === 'MANAGER')
            .map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar__footer">
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <div className="topbar__user">
            <div className="topbar__avatar">
              {user?.name?.[0]?.toUpperCase()}
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
