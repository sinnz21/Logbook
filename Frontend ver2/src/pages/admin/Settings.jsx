import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { getSettings, updateSettings } from '../../api/settings';
import Icon from '../../components/Icon';
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
// autoBackupEnabled. The design also shows maintenance mode, a minimum password
// length and an email-reset switch — those have no column behind them yet, so
// they're called out rather than faked. Backup/restore/export need server-side
// tooling (mysqldump) and sit outside the API.
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
          <Row title="Automated backups" detail="Daily snapshot, kept for the retention window">
            <Toggle on={Boolean(current?.autoBackupEnabled)} onChange={(v) => change({ autoBackupEnabled: v })} disabled={disabled} />
          </Row>
          <Row title="Manual backup" detail="Take a snapshot right now">
            <button
              className="btn btn-primary btn-sm no-print"
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
          <div className="info-note">
            <Icon name="alert" size={17} />
            <span>
              Maintenance mode, the scheduled window and the staff notice have no system_settings
              rows behind them yet. Once the backend adds those fields they drop straight into this card.
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Activity log</h3>
        <div className="card-sub">Every administrative action, kept for audit</div>
        <div className="info-note">
          <Icon name="alert" size={17} />
          <span>
            The audit trail is written server-side but isn&rsquo;t readable over the API yet. This card
            lights up as soon as an activity-log endpoint exists.
          </span>
        </div>
      </div>
    </div>
  );
}
