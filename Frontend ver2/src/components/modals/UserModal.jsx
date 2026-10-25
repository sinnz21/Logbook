import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { createUser, updateUser } from '../../api/users';
import PasswordField from '../PasswordField';
import PasswordRules from '../PasswordRules';
import { meetsPasswordRules, PASSWORD_EXAMPLE } from '../../lib/password';


// modal.data: { user?: UserOut, onSuccess? } — no user → Add user, with user → Edit user.
export default function UserModal() {
  const { closeModal, modal, userId: myId } = useApp();
  const { user, onSuccess } = modal.data || {};
  const editing = Boolean(user);
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'nurse',
    status: user?.status || 'active',
    password: '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const isSelf = editing && user.userId === myId;

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.');
    if (!editing && !/^[a-z0-9._-]{3,50}$/i.test(form.username)) return setError('Username: 3 to 50 letters, numbers, dots, dashes or underscores.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Email looks invalid.');
    if ((!editing || form.password) && !meetsPasswordRules(form.password)) {
      return setError('Password: at least 8 characters with 1 capital letter, 1 number and 1 symbol.');
    }

    const payload = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || null,
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
      title={editing ? `Edit user, ${user.username}` : 'Add user'}
      subtitle="Only admin and nurse or staff roles exist in this system."
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-link" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="field-row">
        <div className="field"><label>First name</label><input type="text" placeholder="e.g. Nina" value={form.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label>Last name</label><input type="text" placeholder="e.g. Santos" value={form.lastName} onChange={set('lastName')} /></div>
      </div>
      <div className="field full" style={{ marginBottom: 14 }}>
        <label>Middle name <span className="opt">(optional)</span></label>
        <input type="text" placeholder="e.g. Reyes" value={form.middleName} onChange={set('middleName')} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Username</label>
          <input type="text" placeholder="e.g. nsantos" value={form.username} onChange={set('username')} readOnly={editing} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="e.g. nsantos@isu.edu.ph" value={form.email} onChange={set('email')} />
        </div>
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
      <div className="field full">
        <label>{editing ? 'New password' : 'Temporary password'} {editing && <span className="opt">(leave blank to keep)</span>}</label>
        <PasswordField
          lockIcon={false}
          placeholder={`e.g. ${PASSWORD_EXAMPLE}`}
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
        />
        {(!editing || form.password) && <PasswordRules password={form.password} />}
      </div>

      {isSelf && <div className="warn-note" style={{ marginTop: 14 }}>You can&rsquo;t change your own role or status.</div>}
    </Modal>
  );
}
