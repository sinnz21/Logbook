import { useApp } from '../../context/useApp';

/** A filled-in blank on the form; falls back to an empty ruled line. */
export function Field({ label, value }) {
  return (
    <div className="doc-field">
      <div className="k">{label}</div>
      <div className="v">{value || ' '}</div>
    </div>
  );
}

/**
 * The shared ISU University Health Service letterhead, the on-screen toolbar
 * (hidden when printing) and the form's footer disclaimer.
 */
export default function DocShell({ code, title, backTo = 'profile', footer, children }) {
  const { navigate } = useApp();

  return (
    <div className="view active">
      <div className="head-actions no-print" style={{ display: 'flex', marginBottom: '16px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(backTo)}>‹ Back</button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          🖨 Print / Save as PDF
        </button>
      </div>

      <div className="doc-sheet">
        <div className="doc-head">
          <div className="org">ISABELA STATE UNIVERSITY</div>
          <div className="unit">University Health Service</div>
          <div className="place">Echague, Isabela · Republic of the Philippines</div>
          <div className="code">{code}</div>
        </div>
        <hr className="doc-rule" />

        <div className="doc-title">{title}</div>

        {children}

        {footer && <div className="doc-foot">{footer}</div>}
      </div>
    </div>
  );
}
