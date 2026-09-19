import { useApp } from '../context/useApp';
import { NAVS } from '../config/navs';
import { ROLE_LABELS } from '../lib/format';

export default function Sidebar() {
  const { role, userName, currentView, navigate, logout } = useApp();
  const navLinks = NAVS[role];

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-name">ISU Infirmary</div>
        <div className="brand-sub">Log Book System</div>
      </div>

      <div className="user">
        <div className="user-name">{userName || (role === 'admin' ? 'Admin' : 'Nurse')}</div>
        <div className="user-role">{ROLE_LABELS[role]}</div>
      </div>

      <ul className="nav">
        {navLinks.map((link) => (
          <li key={link.id}>
            <a
              className={currentView === link.id ? 'active' : ''}
              onClick={() => navigate(link.id)}
            >
              <span className="dot" aria-hidden="true" />
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="signout" onClick={logout}>
        Sign Out
      </div>
    </div>
  );
}
