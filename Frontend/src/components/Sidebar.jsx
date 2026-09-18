import { useApp } from '../context/useApp';
import { NAVS } from '../config/navs';
import { initialsOf, ROLE_LABELS } from '../lib/format';

export default function Sidebar() {
  const { role, userName, currentView, navigate, logout } = useApp();
  const navLinks = NAVS[role];

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="seal">ISU</div>
        <div className="txt">
          <div>ISU Infirmary</div>
          <div>Log Book System</div>
        </div>
      </div>

      <div className="user">
        <div className="av">{initialsOf(userName) || (role === 'admin' ? 'AD' : 'NS')}</div>
        <div>
          <div>{userName || (role === 'admin' ? 'Admin' : 'Nurse')}</div>
          <div>{ROLE_LABELS[role]}</div>
        </div>
      </div>

      <ul className="nav">
        {navLinks.map(link => (
          <li key={link.id}>
            <a
              className={currentView === link.id ? 'active' : ''}
              onClick={() => navigate(link.id)}
            >
              <span className="ic">{link.ic}</span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="signout" onClick={logout}>
        ⏻ Sign Out
      </div>
    </div>
  );
}
