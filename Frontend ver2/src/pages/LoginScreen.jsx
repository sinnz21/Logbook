import { useEffect, useState } from 'react';
import { useApp } from '../context/useApp';
import { requestPasswordReset, resetPassword, verifyResetCode } from '../api/auth';
import Icon from '../components/Icon';
import OtpInput from '../components/OtpInput';
import PasswordField from '../components/PasswordField';
import PasswordRules from '../components/PasswordRules';
import { meetsPasswordRules } from '../lib/password';

const CODE_LENGTH = 6;
const RESEND_AFTER_S = 60;

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Seconds left until `deadline` (ms), ticking once a second, never above `total`. */
function useCountdown(deadline, total) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // `now` is stale from before the deadline was set
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [deadline]);
  return deadline ? Math.min(total, Math.max(0, Math.ceil((deadline - now) / 1000))) : 0;
}

function Brand() {
  return (
    <div className="login-brand">
      <img className="seal" src="/isu-seal.png" alt="Isabela State University seal" />
      <h1>ISU Infirmary</h1>
      <div className="s1">
        Infirmary Log Book System<br />
        Isabela State University, Echague
      </div>
    </div>
  );
}

/** Email → 6-digit code (with expiry timer) → new password → done. */
function ForgotPassword({ onBack }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [codeSeconds, setCodeSeconds] = useState(600);
  const [sentAt, setSentAt] = useState(null);
  const [demoCode, setDemoCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Set when the server cancels the code after too many wrong tries (429).
  const [codeCancelled, setCodeCancelled] = useState(false);
  // Bumped after a wrong code, so the boxes remount empty with the first one focused.
  const [otpKey, setOtpKey] = useState(0);

  const secondsLeft = useCountdown(expiresAt, codeSeconds);
  const sinceSent = useCountdown(sentAt ? sentAt + RESEND_AFTER_S * 1000 : null, RESEND_AFTER_S);
  const expired = step === 'code' && expiresAt && secondsLeft === 0;

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => run(async () => {
    const res = await requestPasswordReset(email.trim());
    const seconds = res?.expiresInSeconds ?? 600;
    setCodeSeconds(seconds);
    setExpiresAt(Date.now() + seconds * 1000);
    setSentAt(Date.now());
    setDemoCode(res?.demoCode || null); // only demo mode sends this back
    setCode('');
    setCodeCancelled(false);
    setStep('code');
  });

  const checkCode = async (value = code) => {
    setBusy(true);
    setError(null);
    try {
      const res = await verifyResetCode(email.trim(), value);
      setResetToken(res.resetToken);
      setStep('password');
    } catch (e) {
      // Wrong code: empty the boxes for another try and show the server's
      // message ("N attempts left"). A 429 means the code was cancelled.
      setCode('');
      setOtpKey((k) => k + 1);
      if (e.status === 429) setCodeCancelled(true);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Typing or pasting the last digit checks the code straight away.
  const changeCode = (value) => {
    setCode(value);
    if (value.length === CODE_LENGTH && !busy && !expired && !codeCancelled) checkCode(value);
  };

  // The live checklist under the boxes shows which rule is still missing.
  const passwordProblem = !meetsPasswordRules(password) || confirm !== password;

  const savePassword = () => run(async () => {
    await resetPassword(resetToken, password);
    setStep('done');
  });

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    if (step === 'email' && email.trim()) sendCode();
    else if (step === 'code' && code.length === CODE_LENGTH && !expired && !codeCancelled) checkCode();
    else if (step === 'password' && !passwordProblem && confirm) savePassword();
  };

  return (
    <form className="login-card" onSubmit={submit}>
      <Brand />
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="chevronLeft" size={16} /> Back to sign in
      </button>

      {step === 'email' && (
        <>
          <h2 className="login-step-title">Reset your password</h2>
          <p className="login-step-text">Type the email address on your account. We&rsquo;ll send a {CODE_LENGTH}-digit security code to it.</p>
          <label htmlFor="reset-email">Email address</label>
          <div className="input-wrap">
            <Icon name="mail" size={17} className="ic" />
            <input
              id="reset-email"
              type="email"
              placeholder="e.g. nsantos@isu.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="go" type="submit" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}>
            {busy ? 'Sending…' : 'Send security code'}
          </button>
        </>
      )}

      {step === 'code' && (
        <>
          <h2 className="login-step-title">Enter the security code</h2>
          <p className="login-step-text">
            If <strong>{email.trim()}</strong> has an account, a {CODE_LENGTH}-digit code is on its way. Check your inbox and spam folder.
          </p>
          {demoCode && (
            <div className="demo-hint">Demo mode: no email is sent. Your code is <strong>{demoCode}</strong>.</div>
          )}
          <OtpInput
            key={otpKey}
            length={CODE_LENGTH}
            value={code}
            onChange={changeCode}
            disabled={busy || expired || codeCancelled}
            invalid={Boolean(error)}
            autoFocus
          />
          <div className={`code-timer${expired || codeCancelled ? ' expired' : secondsLeft <= 60 ? ' soon' : ''}`}>
            <Icon name="clock" size={16} />
            {codeCancelled
              ? 'This code was cancelled. Send a new one.'
              : expired ? 'This code has expired. Send a new one.' : <>Code expires in <strong>{mmss(secondsLeft)}</strong></>}
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="go" type="submit" disabled={busy || expired || codeCancelled || code.length !== CODE_LENGTH}>
            {busy ? 'Checking…' : 'Verify code'}
          </button>
          <div className="login-hint center">The code is checked automatically once all {CODE_LENGTH} digits are in.</div>
          <button
            type="button"
            className="login-forgot center"
            onClick={sendCode}
            disabled={busy || (!expired && !codeCancelled && sinceSent > 0)}
          >
            {!expired && !codeCancelled && sinceSent > 0 ? `Resend code in ${mmss(sinceSent)}` : 'Resend code'}
          </button>
        </>
      )}

      {step === 'password' && (
        <>
          <h2 className="login-step-title">Choose a new password</h2>
          <p className="login-step-text">Each rule below turns green once your new password meets it.</p>
          <label htmlFor="reset-new">New password</label>
          <PasswordField id="reset-new" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus />
          <label htmlFor="reset-confirm">Confirm new password</label>
          <PasswordField id="reset-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          <PasswordRules password={password} confirm={confirm} />
          {error && <div className="login-error">{error}</div>}
          <button className="go" type="submit" disabled={busy || Boolean(passwordProblem) || !confirm}>
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="login-done"><Icon name="shield" size={30} /></div>
          <h2 className="login-step-title center">Password changed</h2>
          <p className="login-step-text center">You can now sign in with your new password.</p>
          <button className="go" type="button" onClick={onBack}>Back to sign in</button>
        </>
      )}
    </form>
  );
}

export default function LoginScreen() {
  const { login, authError, authLoading } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!authLoading) login(username, password);
  };

  return (
    <div id="loginScreen">
      {mode === 'forgot' ? (
        <ForgotPassword onBack={() => setMode('login')} />
      ) : (
        // No role picker: the account's role comes back from the server on
        // sign-in, and the app opens the matching dashboard.
        <form className="login-card" onSubmit={handleSubmit}>
          <Brand />

          <label htmlFor="login-username">Username</label>
          <div className="input-wrap">
            <Icon name="user" size={17} className="ic" />
            <input
              id="login-username"
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <PasswordField
            id="login-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button type="button" className="login-forgot" onClick={() => setMode('forgot')}>
            Forgot password?
          </button>

          {authError && <div className="login-error">{authError}</div>}

          <button className="go" type="submit" disabled={authLoading || !username.trim() || !password}>
            {authLoading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-foot">Admins and nurses use the same sign-in. Locks for 15 minutes after 5 failed attempts.</div>
        </form>
      )}

      <div className="login-page-foot">University Health Services, Echague, Isabela</div>
    </div>
  );
}
