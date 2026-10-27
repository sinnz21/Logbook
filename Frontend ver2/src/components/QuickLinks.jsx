import { useApp } from '../context/useApp';
import Icon from './Icon';

/** A row of shortcut buttons to other screens. links: [{ view, label, icon }] */
export default function QuickLinks({ links }) {
  const { navigate } = useApp();
  return (
    <div className="quick-links no-print">
      <span className="quick-links-label">Quick links</span>
      {links.map((l) => (
        <button key={l.view} type="button" className="btn btn-soft btn-sm" onClick={() => navigate(l.view)}>
          <Icon name={l.icon} size={16} /> {l.label}
        </button>
      ))}
    </div>
  );
}
