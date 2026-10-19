import { useRef } from 'react';

/**
 * One box per digit, like a bank OTP: typing moves to the next box, Backspace
 * on an empty box goes back, arrows move, and pasting a whole code fills
 * every box at once.
 */
export default function OtpInput({ length = 6, value, onChange, disabled, invalid, autoFocus }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const focus = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i, digit) => {
    const next = [...digits];
    next[i] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (i, e) => {
    const typed = e.target.value.replace(/\D/g, '');
    if (!typed) return setAt(i, '');
    if (typed.length > 1) {
      // Autofill or a fast paste into one box: spread it from here on.
      const next = [...digits];
      typed.split('').forEach((d, k) => { if (i + k < length) next[i + k] = d; });
      onChange(next.join(''));
      return focus(i + typed.length);
    }
    setAt(i, typed);
    focus(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      setAt(i - 1, '');
      focus(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  };

  return (
    <div className={`otp${invalid ? ' invalid' : ''}`} role="group" aria-label={`${length}-digit security code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
