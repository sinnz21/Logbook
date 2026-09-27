import { useState } from 'react';
import { useApp } from '../context/useApp';
import Icon from '../components/Icon';

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
          <img className="seal" src="/isu-seal.png" alt="Isabela State University seal" />
          <h1>ISU Infirmary</h1>
          <div className="s1">
            Infirmary Log Book System<br />
            Isabela State University, Echague
          </div>
        </div>

        <div className="lbl-top">Sign in as</div>
        <div className="role-pick">
          <button type="button" className={selectedRole === 'admin' ? 'sel' : ''} onClick={() => pickRole('admin')}>
            Admin
          </button>
          <button type="button" className={selectedRole === 'nurse' ? 'sel' : ''} onClick={() => pickRole('nurse')}>
            Nurse / Staff
          </button>
        </div>

        <label htmlFor="login-username">Username</label>
        <div className="input-wrap">
          <Icon name="user" size={17} className="ic" />
          <input
            id="login-username"
            type="text"
            placeholder={selectedRole === 'admin' ? 'e.g. acruz' : 'e.g. nsantos'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <label htmlFor="login-password">Password</label>
        <div className="input-wrap">
          <Icon name="lock" size={17} className="ic" />
          <input
            id="login-password"
            type="password"
            placeholder="Minimum 8 characters, 1 symbol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="button" className="login-forgot" onClick={() => setShowForgot((s) => !s)}>
          Forgot password?
        </button>
        {showForgot && (
          <div className="login-hint">
            Ask the system admin to reset your password from User management.
          </div>
        )}

        {authError && <div className="login-error">{authError}</div>}

        <button className="go" type="submit" disabled={authLoading}>
          {authLoading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-foot">Locks for 15 minutes after 5 failed attempts</div>
      </form>

      <div className="login-page-foot">University Health Services, Echague, Isabela</div>
    </div>
  );
}
