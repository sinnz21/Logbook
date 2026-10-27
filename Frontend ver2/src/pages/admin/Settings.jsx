import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { getSettings, updateSettings } from '../../api/settings';
import { createBackup, listBackups, restoreBackup } from '../../api/backups';
import { addDays, clinicDay, formatDate, formatTime, parseApiDate } from '../../lib/time';
import Icon from '../../components/Icon';
import { notConnected } from '../../lib/notConnected';

const when = (iso) => {
  const at = parseApiDate(iso);
  return `${formatDate(at)}, ${formatTime(at)}`;
};

/**
 * The clinic day of the next automatic backup: the server takes one every day
 * at 11:59 PM Asia/Manila, so it's today until 23:59 has passed, then tomorrow.
 */
function nextBackupDay(at) {
  const manila = new Date(at.getTime() + 8 * 3600000); // the Philippines has no DST
  const minutes = manila.getUTCHours() * 60 + manila.getUTCMinutes();
  const today = clinicDay(at);
  return minutes < 23 * 60 + 59 ? today : addDays(today, 1);
}

function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`toggle${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
    >
      <div className="knob" />
    </button>
  );
}

function Row({ title, detail, children }) {
  return (
    <div className="settings-row">
      <div>
        <div className="t">{title}</div>
        <div className="d">{detail}</div>
      </div>
      {children}
    </div>
  );
}

// Everything editable here reads/writes system_settings via GET/PATCH /api/settings:
// softDeleteDays, failedLoginLimit, lockoutMinutes, passwordSymbolRequired and
// autoBackupEnabled, plus maintenanceMode and maintenanceMessage (POST
// /api/auth/login answers 503 with that message to nurses while it's on). Backup Now / Restore go through
// /api/backups (see "Backup and recovery" in BACKEND_REQUIREMENTS.md).
export default function Settings() {
  const { navigate, openModal } = useApp();
  const settings = useAsync(() => getSettings(), []);
  const backups = useAsync(() => listBackups(), []);
  const [backingUp, setBackingUp] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [now] = useState(() => new Date());

  const current = draft || settings.data;
  const change = (patch) => {
    setDraft({ ...current, ...patch });
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings(draft);
      setDraft(null);
      settings.reload();
      setMessage({ ok: true, text: 'Settings saved.' });
    } catch (e) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const disabled = !current || saving;

  const backupNow = async () => {
    setBackingUp(true);
    setMessage(null);
    try {
      const b = await createBackup();
      backups.reload();
      setMessage({ ok: true, text: `Backup created: ${b.fileName} (${formatSize(b.sizeBytes)}).` });
    } catch (e) {
      setMessage({ ok: false, text: `Backup failed: ${e.message}` });
    } finally {
      setBackingUp(false);
    }
  };

  const confirmRestore = (b) => openModal('confirm', {
    title: 'Restore this backup?',
    danger: true,
    confirmLabel: 'Restore backup',
    busyLabel: 'Restoring…',
    body: (
      <>
        The database will be rolled back to <strong>{when(b.createdAt)}</strong> ({b.fileName}).
        Anything recorded after that time will be replaced. A safety backup of the current data is
        taken first, so this can be undone.
      </>
    ),
    onConfirm: () => restoreBackup(b.backupId),
    onSuccess: () => {
      backups.reload();
      settings.reload();
      setMessage({ ok: true, text: `Restored the backup from ${when(b.createdAt)}.` });
    },
  });

  const backupList = [...(backups.data || [])].sort((a, b) => parseApiDate(b.createdAt) - parseApiDate(a.createdAt));
  const latest = backupList[0];
  const nextBackup = formatDate(new Date(`${nextBackupDay(now)}T00:00:00Z`));

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>System settings</h1>
          <div className="sub">Backups, retention, security rules and maintenance mode</div>
        </div>
        {draft && (
          <div className="head-actions no-print">
            <button className="btn btn-link" onClick={() => setDraft(null)} disabled={saving}>Discard</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {settings.error && <div className="login-error" style={{ marginBottom: 14 }}>Couldn&rsquo;t load settings: {settings.error}</div>}
      {message && <div className={message.ok ? 'ok-note' : 'login-error'} style={{ marginBottom: 14 }}>{message.text}</div>}

      <div className="chart-row even">
        <div className="card">
          <h3>Backup and recovery</h3>
          <div className="card-sub">Snapshots are taken server-side</div>
          <Row
            title="Automatic daily backup at 11:59 PM"
            detail={current?.autoBackupEnabled
              ? `Next automatic backup: ${nextBackup}, 11:59 PM`
              : 'Off. No automatic backups will be taken.'}
          >
            <Toggle on={Boolean(current?.autoBackupEnabled)} onChange={(v) => change({ autoBackupEnabled: v })} disabled={disabled} />
          </Row>
          <Row title="Back up now" detail={latest ? `Last backup: ${when(latest.createdAt)} (${latest.kind === 'manual' ? 'manual' : 'automatic'})` : 'Take a snapshot right now'}>
            <button className="btn btn-primary btn-sm no-print" onClick={backupNow} disabled={backingUp}>
              <Icon name="cloudUp" size={16} /> {backingUp ? 'Backing up…' : 'Back up now'}
            </button>
          </Row>

          <div className="form-label" style={{ margin: '14px 0 8px' }}>Restore from a backup</div>
          {backups.error ? (
            <div className="info-note"><Icon name="alert" size={17} /><span>{backups.error}</span></div>
          ) : backups.loading ? (
            <div className="sub">Loading backups…</div>
          ) : backupList.length === 0 ? (
            <div className="sub">No backups yet. Take one with Back up now.</div>
          ) : (
            <div className="table-card bordered" style={{ maxHeight: 260, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Taken</th><th>Type</th><th className="num">Size</th><th /></tr></thead>
                <tbody>
                  {backupList.map((b) => (
                    <tr key={b.backupId}>
                      <td className="stack-cell">
                        <div className="nm">{when(b.createdAt)}</div>
                        <div className="lo">{b.createdByName ? `by ${b.createdByName}` : b.fileName}</div>
                      </td>
                      <td><span className={`pill ${b.kind === 'manual' ? 'teal' : 'grey'}`}>{b.kind === 'manual' ? 'Manual' : 'Automatic'}</span></td>
                      <td className="num nowrap">{formatSize(b.sizeBytes)}</td>
                      <td>
                        <div className="cell-actions">
                          <button className="btn btn-ghost btn-sm no-print" onClick={() => confirmRestore(b)}>Restore</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Retention schedule</h3>
          <div className="card-sub">How long deleted records stay recoverable</div>
          <Row title="Export database" detail="Full dump for offline storage">
            <button
              className="btn btn-ghost btn-sm no-print"
              onClick={() => notConnected('Export .SQL', 'database dumps need server-side tooling')}
            >
              <Icon name="download" size={16} /> Export .SQL
            </button>
          </Row>
          <Row title="Soft delete" detail="Deleted records recoverable for this many days">
            <input
              type="number"
              min="1"
              max="3650"
              className="auto"
              style={{ width: 100, textAlign: 'center' }}
              value={current?.softDeleteDays ?? ''}
              disabled={disabled}
              onChange={(e) => change({ softDeleteDays: Number(e.target.value) })}
            />
          </Row>
          <Row title="Trash" detail="Records waiting to be purged">
            <button
              className="btn btn-ghost btn-sm no-print"
              onClick={() => notConnected('Open trash', 'a trash listing endpoint isn\'t available yet')}
            >
              Open trash
            </button>
          </Row>
        </div>
      </div>

      <div className="chart-row even">
        <div className="card">
          <h3>Security</h3>
          <div className="card-sub">Applies to every account</div>
          <Row title="Require a symbol" detail="At least one special character. Eight characters is always enforced.">
            <Toggle on={Boolean(current?.passwordSymbolRequired)} onChange={(v) => change({ passwordSymbolRequired: v })} disabled={disabled} />
          </Row>
          <Row title="Failed login limit" detail="Attempts before the account is locked">
            <input
              type="number"
              min="1"
              max="20"
              className="auto"
              style={{ width: 100, textAlign: 'center' }}
              value={current?.failedLoginLimit ?? ''}
              disabled={disabled}
              onChange={(e) => change({ failedLoginLimit: Number(e.target.value) })}
            />
          </Row>
          <Row title="Lockout duration" detail="Minutes an account stays locked">
            <input
              type="number"
              min="1"
              max="1440"
              className="auto"
              style={{ width: 100, textAlign: 'center' }}
              value={current?.lockoutMinutes ?? ''}
              disabled={disabled}
              onChange={(e) => change({ lockoutMinutes: Number(e.target.value) })}
            />
          </Row>
        </div>

        <div className="card">
          <h3>Maintenance mode</h3>
          <div className="card-sub">Blocks sign-in while the database is being worked on</div>
          <Row
            title="Maintenance mode"
            detail={current?.maintenanceMode
              ? 'On: nurses can’t sign in. Admins still can, to finish the work and switch it off.'
              : 'Off: everyone can sign in'}
          >
            <Toggle on={Boolean(current?.maintenanceMode)} onChange={(v) => change({ maintenanceMode: v })} disabled={disabled} />
          </Row>
          <label className="form-label" htmlFor="maintenance-message" style={{ display: 'block', margin: '14px 0 8px' }}>
            Message nurses see when they try to sign in
          </label>
          <textarea
            id="maintenance-message"
            maxLength={300}
            placeholder="System under maintenance, please try again later."
            value={current?.maintenanceMessage ?? ''}
            onChange={(e) => change({ maintenanceMessage: e.target.value })}
            disabled={disabled}
            style={{ width: '100%' }}
          />
          {draft && (draft.maintenanceMode !== settings.data?.maintenanceMode
            || draft.maintenanceMessage !== settings.data?.maintenanceMessage) ? (
            <div className="warn-note" style={{ marginTop: 12 }}>Click Save changes at the top to apply this.</div>
          ) : settings.data?.maintenanceMode ? (
            <div className="warn-note" style={{ marginTop: 12 }}>
              Maintenance mode is on. Nurses can&rsquo;t sign in until you switch it off.
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Audit log</h3>
            <div className="sub">Every sign-in and every record added, edited or deleted</div>
          </div>
          <button className="btn btn-primary btn-sm no-print" onClick={() => navigate('audit-log')}>Open audit log</button>
        </div>
      </div>
    </div>
  );
}
