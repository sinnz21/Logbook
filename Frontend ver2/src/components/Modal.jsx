/**
 * Generic modal shell matching the Figma mockup's .modal-backdrop/.modal/
 * .modal-head/.modal-body/.modal-actions structure. Only mounted while its
 * own id is the active modal (see ModalRoot), so it always renders "open".
 */
export default function Modal({ wide, maxWidth, title, subtitle, onClose, children, actions }) {
  return (
    <div
      className="modal-backdrop open"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? ' wide' : ''}`} style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
