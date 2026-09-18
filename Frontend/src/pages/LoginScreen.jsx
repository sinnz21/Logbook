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
      <div className="login-brand">
        <div className="seal">ISU</div>
        <h1>ISU Infirmary</h1>
        <div className="s1">Infirmary Log Book System</div>
        <div className="s2">Isabela State University</div>
      </div>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="lbl-top">Sign in as</div>
        <div className="role-pick">
          <button
            type="button"
            className={selectedRole === 'nurse' ? 'sel' : ''}
            onClick={() => pickRole('nurse')}
          >
            🛡 Nurse / Staff
          </button>
          <button
            type="button"
            className={selectedRole === 'admin' ? 'sel' : ''}
            onClick={() => pickRole('admin')}
          >
            👥 Admin
          </button>
        </div>

        {authError && <div className="login-error">{authError}</div>}

        <label>Username</label>
        <input
          type="text"
          placeholder="e.g. nsantos"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <label>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <div className="login-hint">Minimum 8 characters, at least 1 symbol.</div>
        <div className="login-forgot" onClick={() => setShowForgot((s) => !s)}>Forgot Password?</div>
        {showForgot && (
          <div className="login-hint" style={{ marginBottom: '8px' }}>
            Ask the system Admin to reset your password from User Management.
          </div>
        )}
        <button className="go" type="submit" disabled={authLoading}>
          {authLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <div className="login-foot">ISU Infirmary Log Book System</div>
    </div>
  );
}
