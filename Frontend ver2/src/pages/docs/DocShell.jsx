import { useApp } from '../../context/useApp';
import Icon from '../../components/Icon';

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
      <div className="doc-toolbar no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(backTo)}>
          <Icon name="chevronLeft" size={16} /> Back to profile
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="printer" size={17} /> Print or save PDF
        </button>
      </div>

      <div className="doc-sheet">
        <div className="doc-head">
          <img src="/isu-seal.png" alt="" />
          <div>
            <div className="org">ISABELA STATE UNIVERSITY</div>
            <div className="unit">University Health Service</div>
            <div className="place">Echague, Isabela, Republic of the Philippines</div>
          </div>
        </div>
        <hr className="doc-rule" />
        <div className="doc-code">{code}</div>

        <div className="doc-title">{title}</div>

        {children}

        {footer && <div className="doc-foot">{footer}</div>}
      </div>
    </div>
  );
}
