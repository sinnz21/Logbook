import Icon from './Icon';
import { PASSWORD_EXAMPLE, PASSWORD_RULES } from '../lib/password';

/**
 * Live checklist under a new-password box: each rule turns green with a check
 * as soon as the typed password meets it. Pass `confirm` to also show whether
 * the two boxes match.
 */
export default function PasswordRules({ password, confirm }) {
  const items = PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(password) }));
  if (confirm !== undefined) {
    items.push({ id: 'match', label: 'Both passwords match', ok: Boolean(confirm) && confirm === password });
  }
  return (
    <div className="pw-rules" aria-live="polite">
      <ul>
        {items.map((it) => (
          <li key={it.id} className={it.ok ? 'ok' : ''}>
            <Icon name={it.ok ? 'check' : 'circle'} size={16} />
            <span>{it.label}</span>
            <span className="sr-only">{it.ok ? ' (done)' : ' (not yet)'}</span>
          </li>
        ))}
      </ul>
      <div className="pw-example">Example: <strong>{PASSWORD_EXAMPLE}</strong></div>
    </div>
  );
}
