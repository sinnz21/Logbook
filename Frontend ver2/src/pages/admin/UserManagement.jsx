import { useMemo, useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { listUsers } from '../../api/users';
import { getSettings } from '../../api/settings';
import Pagination from '../../components/Pagination';
import Icon from '../../components/Icon';
import { formatDate, formatTime, parseApiDate } from '../../lib/time';
import { initialsOf, ROLE_LABELS } from '../../lib/format';
import { downloadCsv, toCsv } from '../../lib/csv';

const dash = (v) => v || '—';

const CSV_COLUMNS = [
  { header: 'Name', value: (u) => u.fullName },
  { header: 'Username', value: (u) => u.username },
  { header: 'Role', value: (u) => ROLE_LABELS[u.role] || u.role },
  { header: 'Email', value: (u) => u.email },
  { header: 'Created', value: (u) => (u.createdAt ? formatDate(parseApiDate(u.createdAt)) : '') },
  { header: 'Last sign-in', value: (u) => (u.lastLoginAt ? formatDate(parseApiDate(u.lastLoginAt)) : 'Never') },
  { header: 'Status', value: (u) => u.status },
];

/** "Today, 7:58 AM" / "Yesterday, 4:12 PM" / "Sep 12, 2026" — the design's wording. */
function signInLabel(iso, todayKey, yesterdayKey) {
  if (!iso) return 'Never';
  const at = parseApiDate(iso);
  const day = iso.slice(0, 10);
  if (day === todayKey) return `Today, ${formatTime(at)}`;
  if (day === yesterdayKey) return `Yesterday, ${formatTime(at)}`;
  return formatDate(at);
}

export default function UserManagement() {
  const { openModal } = useApp();
  const users = useAsync(() => listUsers(), []);
  const settings = useAsync(() => getSettings(), []);

  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [sort, setSort] = useState('login-desc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const list = useMemo(() => users.data?.items || [], [users.data]);
  const active = list.filter((u) => u.status === 'active').length;
  const admins = list.filter((u) => u.role === 'admin').length;

  const [todayKey, yesterdayKey] = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' });
    const now = new Date();
    return [fmt.format(now), fmt.format(new Date(now.getTime() - 86400000))];
  }, []);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const dir = sort.endsWith('asc') ? 1 : -1;
    return list
      .filter((u) => {
        if (q && ![u.fullName, u.username, u.email].some((s) => s && s.toLowerCase().includes(q))) return false;
        if (filters.role && u.role !== filters.role) return false;
        if (filters.status && u.status !== filters.status) return false;
        const day = u.createdAt?.slice(0, 10);
        if (committed.dateFrom && (!day || day < committed.dateFrom)) return false;
        if (committed.dateTo && (!day || day > committed.dateTo)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort.startsWith('name')) return a.fullName.localeCompare(b.fullName) * dir;
        if (sort.startsWith('created')) return ((a.createdAt || '') < (b.createdAt || '') ? -dir : dir);
        return ((a.lastLoginAt || '') < (b.lastLoginAt || '') ? -dir : dir);
      });
  }, [list, filters, committed, sort]);

  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>User management</h1>
          <div className="sub">
            {list.length} account{list.length === 1 ? '' : 's'}, with creation, role assignment and deactivation
          </div>
        </div>
        <button className="btn btn-primary no-print" onClick={() => openModal('user', { onSuccess: users.reload })}>
          <Icon name="plus" size={18} /> Add user
        </button>
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={17} className="ic" />
            <input type="text" placeholder="Search by name, username or email" value={filters.search} onChange={setFilter('search')} />
          </div>
          <select className="auto" value={filters.role} onChange={setFilter('role')}>
            <option value="">Role: all</option>
            <option value="admin">Admin</option>
            <option value="nurse">Nurse / Staff</option>
          </select>
          <select className="auto" value={filters.status} onChange={setFilter('status')}>
            <option value="">Status: all</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="filter-row">
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div className="spacer" />
          <select className="auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="login-desc">Sort: last sign-in, newest</option>
            <option value="created-desc">Sort: created, newest</option>
            <option value="name-asc">Sort: name, A to Z</option>
          </select>
          <button
            className="btn btn-ghost btn-sm"
            disabled={rows.length === 0}
            onClick={() => downloadCsv('user-accounts.csv', toCsv(rows, CSV_COLUMNS))}
          >
            <Icon name="download" size={16} /> Export list
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="cap ink">Total accounts</div>
          <div className="value">{users.loading ? '…' : list.length}</div>
          <div className="foot">{admins} admin, {list.length - admins} nurse or staff</div>
        </div>
        <div className="kpi">
          <div className="cap green">Active</div>
          <div className="value">{users.loading ? '…' : active}</div>
          <div className="foot">Can sign in now</div>
        </div>
        <div className="kpi">
          <div className="cap red">Inactive</div>
          <div className="value">{users.loading ? '…' : list.length - active}</div>
          <div className="foot">Sign-in blocked</div>
        </div>
        <div className="kpi">
          <div className="cap amber">Lockout policy</div>
          <div className="value">{settings.data?.failedLoginLimit ?? '…'}</div>
          <div className="foot">Locks after {settings.data?.failedLoginLimit ?? 5} failed attempts</div>
        </div>
      </div>

      {users.error && <div className="login-error" style={{ marginBottom: 14 }}>{users.error}</div>}

      <div className="card" style={{ padding: '20px 22px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Accounts</h3>
            <div className="sub">Only admin and nurse or staff accounts exist. Patients never have logins.</div>
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Role</th><th>Email</th>
                <th>Created</th><th>Last sign-in</th><th>Status</th><th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {users.loading ? (
                <tr><td colSpan={8} className="empty-cell">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No accounts match.</td></tr>
              ) : (
                pageRows.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div className={`avatar sm${u.role === 'admin' ? ' blue' : ''}`}>{initialsOf(u.fullName)}</div>
                        <span className="nm">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="sub">{u.username}</td>
                    <td><span className={`pill ${u.role === 'admin' ? 'blue' : 'teal'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td className="sub">{dash(u.email)}</td>
                    <td className="nowrap">{u.createdAt ? formatDate(parseApiDate(u.createdAt)) : '—'}</td>
                    <td className="nowrap">{signInLabel(u.lastLoginAt, todayKey, yesterdayKey)}</td>
                    <td>
                      <span className={`pill ${u.status === 'active' ? 'green' : 'red'}`}>
                        <span className="dot" />{u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="no-print">
                      <div className="cell-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal('user', { user: u, onSuccess: users.reload })}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} perPage={perPage} total={rows.length} onPageChange={setPage} />
      </div>

      <div className="card">
        <h3>Recent account activity</h3>
        <div className="card-sub">Who changed what</div>
        <div className="info-note">
          <Icon name="alert" size={17} />
          <span>
            The account audit trail needs an activity-log endpoint, which the backend doesn&rsquo;t expose
            yet. Password resets and status changes made here are already recorded server-side.
          </span>
        </div>
      </div>
    </div>
  );
}
