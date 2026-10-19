import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { listAuditLogs } from '../../api/audit';
import { listUsers } from '../../api/users';
import { addDays, clinicDay, formatDate, formatTime, parseApiDate } from '../../lib/time';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../lib/audit';
import { ROLE_LABELS } from '../../lib/format';
import { downloadCsv, toCsv } from '../../lib/csv';
import Pagination from '../../components/Pagination';
import Icon from '../../components/Icon';

const today = clinicDay(new Date());

// The KPI tiles: each is one action filter, counted with a 1-row request so
// the number is the server's total rather than whatever page is loaded.
const TILES = [
  { action: 'login', label: 'Sign-ins', cap: 'teal' },
  { action: 'login_failed', label: 'Failed sign-ins', cap: 'red' },
  { action: 'create', label: 'Records added', cap: 'green' },
  { action: 'update', label: 'Records edited', cap: 'blue' },
  { action: 'delete', label: 'Records deleted', cap: 'amber' },
];

async function countByAction(range) {
  const results = await Promise.all(
    TILES.map((t) => listAuditLogs({ action: t.action, dateFrom: range.from, dateTo: range.to, perPage: 1 })),
  );
  return Object.fromEntries(TILES.map((t, i) => [t.action, results[i].total ?? 0]));
}

export default function AuditLog() {
  const [range, setRange] = useState({ from: addDays(today, -29), to: today });
  const [draft, setDraft] = useState(range);
  const [filters, setFilters] = useState({ search: '', action: '', userId: '' });
  const [paging, setPaging] = useState({ page: 1, perPage: 25 });

  const query = { ...filters, dateFrom: range.from, dateTo: range.to };
  const logs = useAsync(
    () => listAuditLogs({ ...query, page: paging.page, perPage: paging.perPage }),
    [range.from, range.to, filters.search, filters.action, filters.userId, paging.page, paging.perPage],
  );
  const counts = useAsync(() => countByAction(range), [range.from, range.to]);
  const users = useAsync(() => listUsers(), []);

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPaging({ ...paging, page: 1 });
  };

  const exportCsv = async () => {
    const all = await listAuditLogs({ ...query, perPage: 200 });
    const csv = toCsv(all.items || [], [
      { header: 'Date', value: (e) => formatDate(parseApiDate(e.at)) },
      { header: 'Time', value: (e) => formatTime(parseApiDate(e.at)) },
      { header: 'User', value: (e) => e.fullName || e.username },
      { header: 'Username', value: (e) => e.username },
      { header: 'Role', value: (e) => ROLE_LABELS[e.role] || e.role },
      { header: 'Action', value: (e) => AUDIT_ACTIONS[e.action]?.label || e.action },
      { header: 'Record', value: (e) => AUDIT_ENTITIES[e.entity] || e.entity || '' },
      { header: 'Details', value: (e) => e.details },
    ]);
    downloadCsv(`audit-log_${range.from}_to_${range.to}.csv`, csv);
  };

  const items = logs.data?.items || [];

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <div className="sub">Who signed in, when, and what they added, edited or deleted</div>
        </div>
        <div className="head-actions no-print">
          <button className="btn btn-ghost" onClick={exportCsv} disabled={!items.length}>
            <Icon name="download" size={17} /> Export (CSV)
          </button>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="printer" size={17} /> Print
          </button>
        </div>
      </div>

      <div className="kpi-row five">
        {TILES.map((t) => (
          <div
            key={t.action}
            className={`kpi clickable${filters.action === t.action ? ' selected' : ''}`}
            onClick={() => { setFilters({ ...filters, action: filters.action === t.action ? '' : t.action }); setPaging({ ...paging, page: 1 }); }}
          >
            <div className={`cap ${t.cap}`}>{t.label}</div>
            <div className="value">{counts.loading ? '…' : counts.error ? '—' : counts.data[t.action]}</div>
            <div className="foot">{formatDate(new Date(`${range.from}T00:00:00Z`))} – {formatDate(new Date(`${range.to}T00:00:00Z`))}</div>
          </div>
        ))}
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={17} className="ic" />
            <input type="search" placeholder="Search user, record or details…" value={filters.search} onChange={setFilter('search')} />
          </div>
          <select className="auto" value={filters.action} onChange={setFilter('action')}>
            <option value="">Action: all</option>
            {Object.entries(AUDIT_ACTIONS).map(([key, a]) => <option key={key} value={key}>{a.label}</option>)}
          </select>
          <select className="auto" value={filters.userId} onChange={setFilter('userId')}>
            <option value="">User: all</option>
            {(users.data?.items || []).map((u) => <option key={u.userId} value={u.userId}>{u.fullName}</option>)}
          </select>
        </div>
        <div className="filter-row">
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
            <span>to</span>
            <input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => { setRange(draft); setPaging({ ...paging, page: 1 }); }}>Apply</button>
        </div>
      </div>

      {logs.error && <div className="login-error" style={{ marginBottom: 14 }}>{logs.error}</div>}

      <div className="card">
        <div className="table-card">
          <table>
            <thead>
              <tr><th>When</th><th>User</th><th>Action</th><th>Record</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.loading ? (
                <tr><td colSpan={5} className="empty-cell">Loading activity…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="empty-cell">No activity matches these filters.</td></tr>
              ) : (
                items.map((e) => {
                  const at = parseApiDate(e.at);
                  const action = AUDIT_ACTIONS[e.action] || { label: e.action, pill: 'grey' };
                  return (
                    <tr key={e.logId}>
                      <td className="nowrap stack-cell">
                        <div className="nm">{formatDate(at)}</div>
                        <div className="lo">{formatTime(at)}</div>
                      </td>
                      <td className="stack-cell">
                        <div className="nm">{e.fullName || e.username || 'Unknown'}</div>
                        <div className="lo">{[e.username, ROLE_LABELS[e.role]].filter(Boolean).join(', ')}</div>
                      </td>
                      <td><span className={`pill ${action.pill}`}><span className="dot" />{action.label}</span></td>
                      <td className="nowrap">{AUDIT_ENTITIES[e.entity] || e.entity || '—'}{e.entityId ? ` #${e.entityId}` : ''}</td>
                      <td>{e.details || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={paging.page}
          perPage={paging.perPage}
          total={logs.data?.total ?? 0}
          onPageChange={(page) => setPaging({ ...paging, page })}
          onPerPageChange={(perPage) => setPaging({ page: 1, perPage })}
        />
      </div>
    </div>
  );
}
