import { useMemo, useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { listUsers } from '../../api/users';
import { getSettings } from '../../api/settings';
import Pagination from '../../components/Pagination';
import { formatDate, formatTime, parseApiDate } from '../../lib/time';
import { ROLE_LABELS } from '../../lib/format';
import { downloadCsv, toCsv } from '../../lib/csv';

const dash = (v) => v || '—';

const CSV_COLUMNS = [
  { header: 'Name', value: (u) => u.fullName },
  { header: 'Username', value: (u) => u.username },
  { header: 'Role', value: (u) => ROLE_LABELS[u.role] || u.role },
  { header: 'Email', value: (u) => u.email },
  { header: 'Created', value: (u) => (u.createdAt ? formatDate(parseApiDate(u.createdAt)) : '') },
  { header: 'Last Sign-in', value: (u) => (u.lastLoginAt ? formatDate(parseApiDate(u.lastLoginAt)) : 'Never') },
  { header: 'Status', value: (u) => u.status },
];

export default function UserManagement() {
  const { openModal } = useApp();
  const users = useAsync(() => listUsers(), []);
  const settings = useAsync(() => getSettings(), []);

  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [sort, setSort] = useState({ by: 'last-login', order: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const list = useMemo(() => users.data?.items || [], [users.data]);
  const active = list.filter((u) => u.status === 'active').length;
  const admins = list.filter((u) => u.role === 'admin').length;

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const dir = sort.order === 'asc' ? 1 : -1;
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
        if (sort.by === 'name') return a.fullName.localeCompare(b.fullName) * dir;
        if (sort.by === 'created') return ((a.createdAt || '') < (b.createdAt || '') ? -dir : dir);
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
          <h1>User Management</h1>
          <div className="sub">
            {list.length} account{list.length === 1 ? '' : 's'} · creation, role assignment and deactivation
          </div>
        </div>
      </div>

      <div className="card no-print" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="🔍 Search by name, username or email…" value={filters.search} onChange={setFilter('search')} />
          <select style={{ maxWidth: '160px' }} value={filters.role} onChange={setFilter('role')}>
            <option value="">Role: All</option>
            <option value="admin">Admin</option>
            <option value="nurse">Nurse / Staff</option>
          </select>
          <select style={{ maxWidth: '160px' }} value={filters.status} onChange={setFilter('status')}>
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="date-range">
            <span>Created from</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <select style={{ maxWidth: '180px' }} value={sort.by} onChange={(e) => setSort({ ...sort, by: e.target.value })}>
              <option value="last-login">Sort by: Last sign-in</option>
              <option value="created">Sort by: Created</option>
              <option value="name">Sort by: Name</option>
            </select>
            <select style={{ maxWidth: '150px' }} value={sort.order} onChange={(e) => setSort({ ...sort, order: e.target.value })}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <button
              className="btn btn-ghost btn-sm"
              disabled={rows.length === 0}
              onClick={() => downloadCsv('user-accounts.csv', toCsv(rows, CSV_COLUMNS))}
            >
              Export list
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('user', { onSuccess: users.reload })}>
              ＋ Add user
            </button>
          </div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Total Accounts</div>
          <div className="value">{users.loading ? '…' : list.length}</div>
          <div className="foot">{admins} admin · {list.length - admins} nurse / staff</div>
        </div>
        <div className="kpi">
          <div className="label">Active</div>
          <div className="value" style={{ color: 'var(--green)' }}>{users.loading ? '…' : active}</div>
          <div className="foot">Can sign in now</div>
        </div>
        <div className="kpi pending">
          <div className="label">Inactive</div>
          <div className="value">{users.loading ? '…' : list.length - active}</div>
          <div className="foot">Sign-in blocked</div>
        </div>
        <div className="kpi warn">
          <div className="label">Lockout Policy</div>
          <div className="value">{settings.data?.failedLoginLimit ?? '…'}</div>
          <div className="foot">
            Attempts before a {settings.data?.lockoutMinutes ?? 15}-minute lock
          </div>
        </div>
      </div>

      {users.error && <div className="login-error">{users.error}</div>}

      <div className="card" style={{ padding: '18px 20px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Accounts</h3>
            <div className="sub">Only Admin and Nurse / Staff exist — patients never have logins</div>
          </div>
        </div>

        <div className="table-card" style={{ margin: '0 -20px' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Role</th><th>Email</th>
                <th>Created</th><th>Last Sign-in</th><th>Status</th><th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.loading ? (
                <tr><td colSpan={8} className="sub empty-cell">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={8} className="sub empty-cell">No accounts match.</td></tr>
              ) : (
                pageRows.map((u) => {
                  const lastLogin = u.lastLoginAt ? parseApiDate(u.lastLoginAt) : null;
                  return (
                    <tr key={u.userId}>
                      <td className="nm">{u.fullName}</td>
                      <td className="sub">{u.username}</td>
                      <td>
                        <span className={`pill ${u.role === 'admin' ? 'senior-badge' : 'pwd-badge'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="sub">{dash(u.email)}</td>
                      <td className="nowrap">{u.createdAt ? formatDate(parseApiDate(u.createdAt)) : '—'}</td>
                      <td className="nowrap">
                        {lastLogin ? formatDate(lastLogin) : 'Never'}
                        {lastLogin && <div className="sub">{formatTime(lastLogin)}</div>}
                      </td>
                      <td>
                        <span className={`pill ${u.status === 'active' ? 'active' : 'inactive'}`}>
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="no-print">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal('user', { user: u, onSuccess: users.reload })}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          perPage={perPage}
          total={rows.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      <div className="card">
        <h3>Recent Account Activity</h3>
        <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Who changed what</div>
        <div className="info-note">
          The account audit trail needs an activity-log endpoint, which the backend doesn&rsquo;t expose
          yet — see BACKEND_REQUIREMENTS.md. Password resets and status changes made here are already
          recorded server-side.
        </div>
      </div>
    </div>
  );
}
