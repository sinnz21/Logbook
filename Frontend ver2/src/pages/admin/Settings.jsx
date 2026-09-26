import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { getSettings, updateSettings } from '../../api/settings';
import { notConnected } from '../../lib/notConnected';

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
// autoBackupEnabled. The Figma also shows maintenance mode, a minimum password
// length and an email-reset switch — those have no column behind them yet, so
// they're called out rather than faked. Backup/restore/export need server-side
// tooling (mysqldump) and sit outside the API entirely.
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
        <div>
          <h1>System Settings</h1>
          <div className="sub">Backups, retention, security rules and maintenance mode</div>
        </div>
        {draft && (
          <div className="head-actions no-print">
            <button className="btn btn-ghost btn-sm" onClick={() => setDraft(null)} disabled={saving}>Discard</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {settings.error && <div className="login-error">Couldn&rsquo;t load settings: {settings.error}</div>}
      {message && <div className={message.ok ? 'ok-note' : 'login-error'}>{message.text}</div>}

      <div className="chart-row">
        <div className="card">
          <h3>Backup &amp; Recovery</h3>
          <Row title="Automated backups" detail="Daily snapshot, taken server-side">
            <Toggle
              on={Boolean(current?.autoBackupEnabled)}
              onChange={(v) => change({ autoBackupEnabled: v })}
              disabled={disabled}
            />
          </Row>
          <Row title="Manual backup" detail="Take a snapshot right now">
            <button
              className="btn btn-ghost btn-sm no-print"
              onClick={() => notConnected('Back up now', 'backups need server-side tooling (mysqldump) that isn\'t set up yet')}
            >
              Back up now
            </button>
          </Row>
          <Row title="Restore from backup" detail="Roll the database back to an earlier snapshot">
            <button
              className="btn btn-ghost btn-sm no-print"
              onClick={() => notConnected('Restore', 'restores need server-side tooling that isn\'t set up yet')}
            >
              Restore
            </button>
          </Row>
        </div>

        <div className="card">
          <h3>Retention Schedule</h3>
          <Row title="Export database" detail="Full dump for offline storage">
            <button
              className="btn btn-outline btn-sm no-print"
              onClick={() => notConnected('Export .SQL', 'database dumps need server-side tooling')}
            >
              Export .SQL
            </button>
          </Row>
          <Row title="Soft delete retention" detail="How many days deleted records stay recoverable">
            <input
              type="number"
              min="1"
              max="3650"
              style={{ maxWidth: '90px' }}
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

      <div className="chart-row">
        <div className="card">
          <h3>Security</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '6px' }}>Applies to every account</div>
          <Row title="Require a symbol" detail="At least one special character; 8 characters is always enforced">
            <Toggle
              on={Boolean(current?.passwordSymbolRequired)}
              onChange={(v) => change({ passwordSymbolRequired: v })}
              disabled={disabled}
            />
          </Row>
          <Row title="Failed login limit" detail="Attempts before the account is locked">
            <input
              type="number"
              min="1"
              max="20"
              style={{ maxWidth: '90px' }}
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
              style={{ maxWidth: '90px' }}
              value={current?.lockoutMinutes ?? ''}
              disabled={disabled}
              onChange={(e) => change({ lockoutMinutes: Number(e.target.value) })}
            />
          </Row>
        </div>

        <div className="card">
          <h3>Maintenance Mode</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>
            Blocks sign-in while the database is being worked on
          </div>
          <div className="info-note">
            Maintenance mode, the scheduled window and the staff notice have no
            <code> system_settings </code> rows behind them yet. Once the backend adds those
            fields, they drop straight into this card — see BACKEND_REQUIREMENTS.md.
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Activity Log</h3>
        <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>
          Every administrative action, kept for audit
        </div>
        <div className="info-note">
          The audit trail is written server-side but isn&rsquo;t readable over the API yet. This card
          lights up as soon as an activity-log endpoint exists.
        </div>
      </div>
    </div>
  );
}
