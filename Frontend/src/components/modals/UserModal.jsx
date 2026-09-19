import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { createUser, updateUser } from '../../api/users';

// Mirrors the login screen's stated policy and system_settings.password_symbol_required.
const PASSWORD_RULE = /^(?=.*[^A-Za-z0-9]).{8,}$/;

// modal.data: { user?: UserOut, onSuccess? } — no user → Add User, with user → Edit User.
export default function UserModal() {
  const { closeModal, modal, userId: myId } = useApp();
  const { user, onSuccess } = modal.data || {};
  const editing = Boolean(user);
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'nurse',
    status: user?.status || 'active',
    password: '',
    confirm: '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const isSelf = editing && user.userId === myId;

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.');
    if (!editing && !/^[a-z0-9._-]{3,50}$/i.test(form.username)) return setError('Username: 3–50 letters, numbers, dots, dashes or underscores.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Email looks invalid.');
    if (!editing || form.password) {
      if (!PASSWORD_RULE.test(form.password)) return setError('Password: minimum 8 characters, at least 1 symbol.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      role: form.role,
      status: form.status,
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    setError(null);
    try {
      if (editing) await updateUser(user.userId, payload);
      else await createUser({ ...payload, username: form.username.trim() });
      onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? `Edit user — ${user.username}` : 'Add user'}
      subtitle={editing ? 'Update role, status, or reset the password' : 'Only Admin and Nurse / Staff roles exist in this system.'}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}
      <div className="field-row">
        <div className="field"><label>First Name</label><input type="text" value={form.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label>Last Name</label><input type="text" value={form.lastName} onChange={set('lastName')} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Username</label><input type="text" placeholder="e.g. cgaffud" value={form.username} onChange={set('username')} readOnly={editing} /></div>
        <div className="field"><label>Email <span className="opt">(Optional)</span></label><input type="email" placeholder="e.g. cgaffud@isu.edu.ph" value={form.email} onChange={set('email')} /></div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Role</label>
          <select value={form.role} onChange={set('role')} disabled={isSelf}>
            <option value="nurse">Nurse / Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={set('status')} disabled={isSelf}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>{editing ? 'New Password' : 'Password'} {editing && <span className="opt">(leave blank to keep)</span>}</label><input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></div>
        <div className="field"><label>Confirm Password</label><input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></div>
      </div>
      <div className="modal-note">
        {isSelf ? "You can't change your own role or status." : 'Minimum 8 characters, at least 1 symbol.'}
      </div>
    </Modal>
  );
}
