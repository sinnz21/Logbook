import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { getSettings, updateSettings } from '../../api/settings';
import { notConnected } from '../../lib/notConnected';

function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)} disabled={disabled} aria-pressed={on}>
      <div className="knob"></div>
    </button>
  );
}

// Everything here reads/writes system_settings via GET/PATCH /api/settings.
// Backup/restore/export need server-side tooling (mysqldump) and are left for later.
export default function Settings() {
  const settings = useAsync(() => getSettings(), []);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  return (
    <div className="view active">
      <div className="page-head">
        <div><h1>System Settings</h1><div className="sub">Configure logs, database snapshots, security, and retention</div></div>
        {draft && (
          <div className="head-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setDraft(null)} disabled={saving}>Discard</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        )}
      </div>

      {settings.error && <div className="login-error">Couldn't load settings: {settings.error}</div>}
      {message && <div className={message.ok ? 'ok-note' : 'login-error'}>{message.text}</div>}

      <div className="chart-row">
        <div className="card">
          <h3>Backup Settings</h3>
          <div className="settings-row">
            <div><div className="t">Automated Daily Backups</div><div className="d">Daily snapshots are taken automatically at 3:00 AM.</div></div>
            <Toggle on={Boolean(current?.autoBackupEnabled)} onChange={(v) => change({ autoBackupEnabled: v })} disabled={disabled} />
          </div>
          <div className="head-actions" style={{ marginTop: '12px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => notConnected('Backup Now', 'backups need server-side tooling (mysqldump) that isn\'t set up yet')}>⬇ Backup Now (Manual)</button>
            <button className="btn btn-ghost btn-sm" onClick={() => notConnected('Recover from Backup', 'restores need server-side tooling that isn\'t set up yet')}>↻ Recover from Backup</button>
          </div>
        </div>
        <div className="card">
          <h3>Database &amp; Retention</h3>
          <div className="head-actions" style={{ marginBottom: '12px' }}>
            <button className="btn btn-outline btn-sm" onClick={() => notConnected('Export as SQL', 'database dumps need server-side tooling')}>Export as SQL</button>
            <button className="btn btn-outline btn-sm" onClick={() => notConnected('Export as CSV', 'use Export on Visit Records for visit data')}>Export as .CSV</button>
          </div>
          <div className="settings-row" style={{ border: 'none' }}>
            <div>
              <div className="t">Soft Delete Retention</div>
              <div className="d">Deleted records are kept in trash this many days before permanent erase.</div>
            </div>
            <input type="number" min="1" max="3650" style={{ maxWidth: '90px' }} value={current?.softDeleteDays ?? ''} disabled={disabled} onChange={(e) => change({ softDeleteDays: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Security Settings</h3>
        <div className="settings-row">
          <div><div className="t">Require a symbol in passwords</div><div className="d">Minimum 8 characters is always enforced.</div></div>
          <Toggle on={Boolean(current?.passwordSymbolRequired)} onChange={(v) => change({ passwordSymbolRequired: v })} disabled={disabled} />
        </div>
        <div className="field-row" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>Failed Login Lockout — Attempts</label>
            <input type="number" min="1" max="20" value={current?.failedLoginLimit ?? ''} disabled={disabled} onChange={(e) => change({ failedLoginLimit: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Lockout Duration (minutes)</label>
            <input type="number" min="1" max="1440" value={current?.lockoutMinutes ?? ''} disabled={disabled} onChange={(e) => change({ lockoutMinutes: Number(e.target.value) })} />
          </div>
        </div>
      </div>
    </div>
  );
}
