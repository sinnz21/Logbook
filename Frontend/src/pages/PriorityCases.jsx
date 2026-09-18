import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listSpecialCases } from '../api/patients';
import { formatLongDate, formatTime, parseApiDate } from '../lib/time';
import { SPECIAL_CASE_CLASS, specialCaseCategory, specialCaseLabel } from '../lib/format';

const TABS = [
  { id: 'all', label: 'All Priority Cases' },
  { id: 'pwd', label: 'PWD' },
  { id: 'senior', label: 'Senior Citizen' },
  { id: 'medical', label: 'Allergies & Chronic' },
];

export default function PriorityCases() {
  const { openModal, navigate } = useApp();
  const cases = useAsync(() => listSpecialCases({ active: true }), []);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ by: 'date', order: 'desc' });

  const all = useMemo(() => cases.data || [], [cases.data]);
  const counts = useMemo(() => {
    const c = { all: all.length, pwd: 0, senior: 0, medical: 0 };
    for (const row of all) c[specialCaseCategory(row.caseName)]++;
    return c;
  }, [all]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dir = sort.order === 'asc' ? 1 : -1;
    const key = sort.by === 'name' ? (r) => r.patientName.toLowerCase() : (r) => r.flaggedAt;
    return all
      .filter((r) => tab === 'all' || specialCaseCategory(r.caseName) === tab)
      .filter((r) => !q || [r.patientName, r.patientNumber, r.caseName, r.notes].some((s) => s && s.toLowerCase().includes(q)))
      .sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
  }, [all, tab, search, sort]);

  const toggleSort = (by) => setSort((s) => ({ by, order: s.by === by && s.order === 'desc' ? 'asc' : 'desc' }));
  const sortIcon = (by) => (sort.by === by ? (sort.order === 'desc' ? '↓' : '↑') : '↕');

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Priority &amp; Special Cases</h1>
          <div className="sub">Flags this patient for priority handling (PWD / Senior) and logs persistent conditions (allergies, chronic illnesses) to show on every future visit.</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('flagPatient', { onSuccess: cases.reload })}>＋ Flag Patient</button>
      </div>

      <div className="card">
        <div className="roster-search">
          <span className="ic">⌕</span>
          <input type="text" placeholder="Search roster by name, ID, or case type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="tabs" style={{ marginBottom: '12px' }}>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label} ({counts[t.id]})
            </button>
          ))}
        </div>

        {cases.error && <div className="login-error">{cases.error}</div>}

        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('date')}>DATE/TIME <span className="sort-ic">{sortIcon('date')}</span></th>
              <th className="sortable" onClick={() => toggleSort('name')}>NAME <span className="sort-ic">{sortIcon('name')}</span></th>
              <th>CASE TYPE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {cases.loading ? (
              <tr><td colSpan={4} className="sub empty-cell">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="sub empty-cell">No flagged patients{tab !== 'all' || search ? ' match' : ' yet'}.</td></tr>
            ) : (
              rows.map((r) => {
                const at = parseApiDate(r.flaggedAt);
                return (
                  <tr className="rowlink" key={r.patientSpecialCaseId} onClick={() => navigate('profile', { patientId: r.patientId, patientName: r.patientName })}>
                    <td>{formatLongDate(at)}<br /><span className="sub">{formatTime(at)}</span></td>
                    <td>
                      <div className="nm">{r.patientName}</div>
                      <div className="sub">{[r.patientTypeName, r.patientNumber].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td><span className={SPECIAL_CASE_CLASS[specialCaseCategory(r.caseName)]}>{specialCaseLabel(r)}</span></td>
                    <td><span className={`pill ${r.active ? 'active' : 'inactive'}`}>{r.active ? 'ACTIVE' : 'RETIRED'}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="pagination-bar">
          <div className="pg-size">Showing {rows.length} result{rows.length === 1 ? '' : 's'}</div>
        </div>
      </div>
    </div>
  );
}
