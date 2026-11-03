import { useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listStock, listStockRequests } from '../api/stock';
import { NAVS } from '../config/navs';
import { initialsOf, ROLE_LABELS } from '../lib/format';
import Icon from './Icon';

export default function Sidebar() {
  const { role, userName, currentView, navigate, logout } = useApp();
  const items = NAVS[role];
  // group label → open/closed, once the user has clicked its header. Until then
  // a group is open exactly when one of its pages is the current view.
  const [toggled, setToggled] = useState({});

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

  const link = (item) => (
    <a
      className={currentView === item.id ? 'active' : ''}
      onClick={() => navigate(item.id)}
    >
      {item.icon && <Icon name={item.icon} size={19} />}
      {item.label}
      {item.badge && badges[item.badge] > 0 && (
        <span className="count">{badges[item.badge]}</span>
      )}
    </a>
  );

  /** Is the current view this link, or anywhere inside this group? */
  const contains = (item) => (item.children ? item.children.some(contains) : item.id === currentView);
  const isOpen = (item) => toggled[item.group] ?? contains(item);

  // Sibling sub-groups work like an accordion: opening Tables closes Analytics.
  const toggle = (item, siblings) => {
    const next = { ...toggled, [item.group]: !isOpen(item) };
    if (next[item.group]) {
      for (const s of siblings) if (s.group && s !== item) next[s.group] = false;
    }
    setToggled(next);
  };

  const group = (item, siblings, nested = false) => {
    const current = contains(item);
    const open = isOpen(item);
    return (
      <li key={`group-${item.group}`}>
        <a
          className={`group-head${nested ? ' nested' : ''}${open ? ' open' : ''}${current ? ' current' : ''}`}
          onClick={() => toggle(item, siblings)}
          aria-expanded={open}
        >
          {!nested && <Icon name={item.icon} size={19} />}
          {item.group}
          <Icon name="chevronRight" size={nested ? 15 : 17} className="chev" />
        </a>
        {open && (
          <ul className="sub-nav">
            {item.children.map((c) => (c.children ? group(c, item.children, true) : <li key={c.id}>{link(c)}</li>))}
          </ul>
        )}
      </li>
    );
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
          ) : item.group ? (
            group(item, items)
          ) : (
            <li key={item.id || i}>{link(item)}</li>
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
