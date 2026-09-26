import { useState } from 'react';
import { useApp } from '../context/useApp';

export default function LoginScreen() {
  const { login, authError, authLoading } = useApp();
  // Purely a UI hint (prefills a plausible username) — the backend, not this
  // toggle, decides the account's actual role from the users table.
  const [selectedRole, setSelectedRole] = useState('nurse');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const pickRole = (r) => {
    setSelectedRole(r);
    setUsername(r === 'admin' ? 'acruz' : 'nsantos');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!authLoading) login(username, password);
  };

  return (
    <div id="loginScreen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="seal" aria-hidden="true" />
          <h1>ISU Infirmary</h1>
          <div className="s1">Infirmary Log Book System</div>
          <div className="s1">Isabela State University</div>
        </div>

        <div className="lbl-top">Sign in as</div>
        <div className="role-pick">
          <button
            type="button"
            className={selectedRole === 'admin' ? 'sel' : ''}
            onClick={() => pickRole('admin')}
          >
            Admin
          </button>
          <button
            type="button"
            className={selectedRole === 'nurse' ? 'sel' : ''}
            onClick={() => pickRole('nurse')}
          >
            Nurse / Staff
          </button>
        </div>

        {authError && <div className="login-error">{authError}</div>}

        <label htmlFor="login-username">Username</label>
        <input
          id="login-username"
          type="text"
          placeholder="e.g. nsantos"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button type="button" className="login-forgot" onClick={() => setShowForgot((s) => !s)}>
          Forgot password?
        </button>
        {showForgot && (
          <div className="login-hint">
            Ask the system Admin to reset your password from User Management.
          </div>
        )}

        <button className="go" type="submit" disabled={authLoading}>
          {authLoading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="login-foot">Locks for 15 minutes after 5 failed attempts</div>
      </form>
    </div>
  );
}
