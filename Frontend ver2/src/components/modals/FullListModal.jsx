import { useMemo, useState } from 'react';
import Modal from '../Modal';
import Icon from '../Icon';
import { useApp } from '../../context/useApp';
import { downloadCsv, toCsv } from '../../lib/csv';

// "View full list" — the complete ranking behind a top-5 card.
// modal.data: { title, subtitle?, rows: [{ name, count, pct }], nameLabel?, countLabel?, formatCount? }
export default function FullListModal() {
  const { closeModal, modal } = useApp();
  const {
    title = 'Full list',
    subtitle,
    rows = [],
    nameLabel = 'Name',
    countLabel = 'Count',
    formatCount = (n) => n,
  } = modal.data || {};
  const [search, setSearch] = useState('');

  const ranked = useMemo(() => rows.map((r, i) => ({ ...r, rank: i + 1 })), [rows]);
  const shown = ranked.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const exportCsv = () => {
    const csv = toCsv(ranked, [
      { header: 'Rank', value: (r) => r.rank },
      { header: nameLabel, value: (r) => r.name },
      { header: countLabel, value: (r) => r.count },
      { header: 'Share (%)', value: (r) => r.pct },
    ]);
    downloadCsv(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, csv);
  };

  return (
    <Modal
      wide
      title={title}
      subtitle={subtitle || `${rows.length} entries, ${formatCount(total)} in total`}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost left" onClick={exportCsv} disabled={!rows.length}>
            <Icon name="download" size={16} /> Export (CSV)
          </button>
          <button className="btn btn-primary" onClick={closeModal}>Done</button>
        </>
      }
    >
      <div className="search-field" style={{ marginBottom: 14 }}>
        <Icon name="search" size={17} className="ic" />
        <input type="search" placeholder={`Search ${nameLabel.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="table-card bordered" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr><th style={{ width: 60 }}>#</th><th>{nameLabel}</th><th className="num">{countLabel}</th><th className="num">Share</th><th style={{ width: 140 }} /></tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">{rows.length ? 'No matches.' : 'Nothing recorded in this range.'}</td></tr>
            ) : (
              shown.map((r) => (
                <tr key={r.name}>
                  <td className="sub">{r.rank}</td>
                  <td className="nm">{r.name}</td>
                  <td className="num">{formatCount(r.count)}</td>
                  <td className="num">{r.pct}%</td>
                  <td>
                    <span className="mini-track"><span style={{ width: `${Math.max(r.width ?? r.pct, 1)}%` }} /></span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
