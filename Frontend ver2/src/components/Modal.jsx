/**
 * Generic modal shell for the v2 design: rounded card, title with an optional
 * status pill, a soft square close button, and a footer action row where a
 * `.left` child (e.g. "Print slip") is pushed to the opposite end.
 *
 * Only mounted while its own id is the active modal (see ModalRoot), so it
 * always renders "open".
 */
export default function Modal({ wide, narrow, maxWidth, title, badge, subtitle, onClose, children, actions }) {
  return (
    <div
      className="modal-backdrop open"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal${wide ? ' wide' : ''}${narrow ? ' narrow' : ''}`}
        style={maxWidth ? { maxWidth } : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <div>
            <h3>
              {title}
              {badge}
            </h3>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
