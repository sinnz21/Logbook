import { useState } from 'react';
import Icon from './Icon';

/**
 * A password box with an eye button that shows or hides what was typed.
 * Crossed-out eye = hidden (the default); open eye = shown.
 * Every other prop (id, value, onChange, placeholder, autoComplete…) goes to the <input>.
 * `lockIcon` draws the lock on the left, as on the login screen.
 */
export default function PasswordField({ lockIcon = true, ...inputProps }) {
  const [show, setShow] = useState(false);
  const label = show ? 'Hide password' : 'Show password';
  return (
    <div className={`input-wrap pw-wrap${lockIcon ? '' : ' no-lock'}`}>
      {lockIcon && <Icon name="lock" size={17} className="ic" />}
      <input {...inputProps} type={show ? 'text' : 'password'} />
      <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={label} title={label}>
        <Icon name={show ? 'eye' : 'eyeOff'} size={18} />
      </button>
    </div>
  );
}
