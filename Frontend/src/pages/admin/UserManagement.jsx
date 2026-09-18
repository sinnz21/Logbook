import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { listUsers } from '../../api/users';
import { formatDate, parseApiDate } from '../../lib/time';
import { ROLE_LABELS } from '../../lib/format';

export default function UserManagement() {
  const { openModal } = useApp();
  const users = useAsync(() => listUsers(), []);
  const list = users.data?.items || [];

  return (
    <div className="view active">
      <div className="page-head">
        <div><h1>User Management</h1><div className="sub">{list.length} system users registered</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('user', { onSuccess: users.reload })}>＋ Add User</button>
      </div>
      {users.error && <div className="login-error">{users.error}</div>}
      <div className="card table-card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Name</th><th>Username</th><th>Role</th><th>Email</th><th>Last Login</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.loading ? (
              <tr><td colSpan={7} className="sub empty-cell">Loading…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="sub empty-cell">No users yet.</td></tr>
            ) : (
              list.map((u) => (
                <tr key={u.userId}>
                  <td className="nm">{u.fullName}</td>
                  <td className="sub">{u.username}</td>
                  <td>{ROLE_LABELS[u.role] || u.role}</td>
                  <td className="sub">{u.email || '—'}</td>
                  <td className="sub">{u.lastLoginAt ? formatDate(parseApiDate(u.lastLoginAt)) : 'Never'}</td>
                  <td><span className={`pill ${u.status === 'active' ? 'active' : 'inactive'}`}>{u.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openModal('user', { user: u, onSuccess: users.reload })}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
