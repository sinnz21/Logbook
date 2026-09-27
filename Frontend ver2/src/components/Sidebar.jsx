import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listStock, listStockRequests } from '../api/stock';
import { NAVS } from '../config/navs';
import { initialsOf, ROLE_LABELS } from '../lib/format';
import Icon from './Icon';

export default function Sidebar() {
  const { role, userName, currentView, navigate, logout } = useApp();
  const items = NAVS[role];

  // The two counters the design shows on the sidebar. They fail quietly: a
  // missing endpoint just means no badge, never a broken nav.
  const stock = useAsync(
    () => (role === 'nurse' ? listStock({ perPage: 200 }) : Promise.resolve(null)),
    [role],
  );
  const requests = useAsync(
    () => (role === 'admin' ? listStockRequests({ status: 'pending', perPage: 100 }) : Promise.resolve(null)),
    [role],
  );

  const badges = {
    lowStock: (stock.data?.items || []).filter((i) => i.stockStatus !== 'high').length,
    pendingRequests: requests.data?.total ?? (requests.data?.items || []).length,
  };

  return (
    <div className="sidebar">
      <div className="brand">
        <img src="/isu-seal.png" alt="" width="38" height="38" />
        <div>
          <div className="brand-name">ISU Infirmary</div>
          <div className="brand-sub">Log Book System</div>
        </div>
      </div>

      <div className="user">
        <div className={`avatar sm${role === 'admin' ? ' blue' : ''}`}>
          {initialsOf(userName) || (role === 'admin' ? 'AD' : 'NS')}
        </div>
        <div>
          <div className="user-name">{userName || (role === 'admin' ? 'Admin' : 'Nurse')}</div>
          <div className="user-role">{ROLE_LABELS[role]}</div>
        </div>
      </div>

      <ul className="nav">
        {items.map((item, i) =>
          item.section ? (
            <li className="sec" key={`sec-${item.section}`}>{item.section}</li>
          ) : (
            <li key={item.id || i}>
              <a
                className={currentView === item.id ? 'active' : ''}
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} size={19} />
                {item.label}
                {item.badge && badges[item.badge] > 0 && (
                  <span className="count">{badges[item.badge]}</span>
                )}
              </a>
            </li>
          ),
        )}
      </ul>

      <div className="signout" onClick={logout}>
        <Icon name="signOut" size={19} />
        Sign out
      </div>
    </div>
  );
}
