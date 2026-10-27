import { useMemo, useState } from 'react';
import Modal from '../Modal';
import Icon from '../Icon';
import { useApp } from '../../context/useApp';
import { formatDate, formatTime, parseApiDate } from '../../lib/time';
import { downloadCsv, toCsv } from '../../lib/csv';

const DISPOSITION_PILL = (name = '') =>
  /hospital|referred/i.test(name) ? 'blue' : /sent home/i.test(name) ? 'amber' : 'teal';

// "Who had this illness?" — opened by clicking an illness on a complaints donut
// or on the Full lists page.
// modal.data: { complaint, visits (already filtered to this complaint), rangeLabel }
export default function ComplaintPatientsModal() {
  const { closeModal, modal, navigate, role } = useApp();
  const { complaint = '', visits = [], rangeLabel = '' } = modal.data || {};
  const [search, setSearch] = useState('');
  // The patient profile is a nurse screen, so only nurses get the View button.
  const canView = role === 'nurse';

  const sorted = useMemo(
    () => [...visits].sort((a, b) => parseApiDate(b.startedAt) - parseApiDate(a.startedAt)),
    [visits],
  );
  const q = search.trim().toLowerCase();
  const shown = q
    ? sorted.filter((v) => [v.patientName, v.patientNumber, v.program, v.department]
      .some((s) => s && s.toLowerCase().includes(q)))
    : sorted;
  const patients = new Set(visits.map((v) => v.patientId ?? v.patientName)).size;

  const exportCsv = () => {
    const csv = toCsv(sorted, [
      { header: 'Date', value: (v) => formatDate(parseApiDate(v.startedAt)) },
      { header: 'Time', value: (v) => formatTime(parseApiDate(v.startedAt)) },
      { header: 'Patient', value: (v) => v.patientName },
      { header: 'Type', value: (v) => v.patientTypeName },
      { header: 'ID', value: (v) => v.patientNumber },
      { header: 'Program', value: (v) => v.program },
      { header: 'Department', value: (v) => v.department },
      { header: 'Chief complaint', value: (v) => v.chiefComplaint },
      { header: 'Disposition', value: (v) => v.dispositionName || 'In care' },
    ]);
    downloadCsv(`patients-with-${complaint.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, csv);
  };

  const cols = canView ? 6 : 5;

  return (
    <Modal
      wide
      maxWidth={1040}
      title={`Patients with ${complaint}`}
      subtitle={`${visits.length} visit${visits.length === 1 ? '' : 's'} by ${patients} patient${patients === 1 ? '' : 's'}, ${rangeLabel}`}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost left" onClick={exportCsv} disabled={!visits.length}>
            <Icon name="download" size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={closeModal}>Close</button>
        </>
      }
    >
      <div className="search-field" style={{ marginBottom: 14 }}>
        <Icon name="search" size={17} className="ic" />
        <input
          type="search"
          placeholder="Search name, ID, program or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="table-card bordered" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Patient</th><th>Program / department</th><th>Chief complaint</th><th>Disposition</th>
              {canView && <th />}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={cols} className="empty-cell">{visits.length ? 'No matches.' : 'No visits in this range.'}</td></tr>
            ) : (
              shown.map((v) => {
                const at = parseApiDate(v.startedAt);
                return (
                  <tr key={v.visitId}>
                    <td className="stack-cell nowrap">
                      <div className="nm">{formatDate(at)}</div>
                      <div className="lo">{formatTime(at)}</div>
                    </td>
                    <td className="stack-cell">
                      <div className="nm">{v.patientName}</div>
                      <div className="lo">{[v.patientTypeName, v.patientNumber].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className="stack-cell">
                      <div>{v.program || '—'}</div>
                      {v.department && <div className="lo">{v.department}</div>}
                    </td>
                    <td>{v.chiefComplaint || '—'}</td>
                    <td>
                      {v.dispositionName
                        ? <span className={`pill ${DISPOSITION_PILL(v.dispositionName)}`}><span className="dot" />{v.dispositionName}</span>
                        : <span className="pill pending"><span className="dot" />In care</span>}
                    </td>
                    {canView && (
                      <td>
                        <div className="cell-actions">
                          <button className="btn btn-soft btn-sm" onClick={() => navigate('profile', v)}>View</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
