import React, { useEffect, useState } from 'react';
import { adminApi, AdminUser, DashboardStats, PaginatedUsers } from '../../core/api/admin.api';

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 };
const buttonStyle: React.CSSProperties = { background: '#166534', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13 };
const statCardStyle: React.CSSProperties = { ...cardStyle, textAlign: 'center' };
const roleColors: Record<string, { bg: string; text: string }> = { admin: { bg: '#fef2f2', text: '#b91c1c' }, manager: { bg: '#fef3c7', text: '#92400e' }, farmer: { bg: '#dcfce7', text: '#166534' }, consumer: { bg: '#dbeafe', text: '#1d4ed8' } };

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([adminApi.getDashboard(), adminApi.getUsers({ page, limit: 10, role: roleFilter || undefined, search: searchTerm || undefined })]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data);
    } catch (err: any) { setError(err.message || 'Khong tai duoc du lieu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, roleFilter]);

  const handleToggleStatus = async (user: AdminUser) => {
    try { await adminApi.toggleUserStatus(user._id, !user.isActive); fetchData(); } catch (err: any) { setError(err.message); }
  };

  const handleChangeRole = async (user: AdminUser, newRole: AdminUser['role']) => {
    try { await adminApi.updateUserRole(user._id, newRole); fetchData(); } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Xoa nguoi dung nay?')) return;
    try { await adminApi.deleteUser(userId); fetchData(); } catch (err: any) { setError(err.message); }
  };

  if (loading && !stats) return <p>Dang tai...</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Bang dieu khien Admin</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Thong ke he thong va quan ly nguoi dung</p>
      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={statCardStyle}><div style={{ fontSize: 32, fontWeight: 800, color: '#166534' }}>{stats.users.total}</div><div style={{ color: '#64748b' }}>Nguoi dung</div></div>
          <div style={statCardStyle}><div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>{stats.products.total}</div><div style={{ color: '#64748b' }}>Lo nong san</div></div>
          <div style={statCardStyle}><div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed' }}>{stats.traceEvents.total}</div><div style={{ color: '#64748b' }}>Su kien truy xuat</div></div>
          <div style={statCardStyle}><div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{stats.traceEvents.thisWeek}</div><div style={{ color: '#64748b' }}>Su kien tuan nay</div></div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Quan ly nguoi dung</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Tim kiem..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 200 }} />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
              <option value="">Tat ca quyen</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="farmer">Farmer</option><option value="consumer">Consumer</option>
            </select>
          </div>
        </div>

        {users && users.users.length > 0 ? (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: 10, textAlign: 'left' }}>Ten</th><th style={{ padding: 10, textAlign: 'left' }}>Email</th><th style={{ padding: 10, textAlign: 'left' }}>Quyen</th><th style={{ padding: 10, textAlign: 'left' }}>Trang thai</th><th style={{ padding: 10, textAlign: 'left' }}>Thao tac</th></tr></thead>
              <tbody>
                {users.users.map((user) => {
                  const colors = roleColors[user.role] || roleColors.consumer;
                  return (
                    <tr key={user._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 10 }}>{user.first_name} {user.last_name}</td>
                      <td style={{ padding: 10 }}>{user.email}</td>
                      <td style={{ padding: 10 }}>
                        <select value={user.role} onChange={(e) => handleChangeRole(user, e.target.value as AdminUser['role'])} style={{ background: colors.bg, color: colors.text, border: 'none', borderRadius: 4, padding: '4px 8px', fontWeight: 600, cursor: 'pointer' }}>
                          <option value="admin">Admin</option><option value="manager">Manager</option><option value="farmer">Farmer</option><option value="consumer">Consumer</option>
                        </select>
                      </td>
                      <td style={{ padding: 10 }}><span style={{ background: user.isActive ? '#dcfce7' : '#fef2f2', color: user.isActive ? '#166534' : '#b91c1c', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{user.isActive ? 'Hoat dong' : 'Bi khoa'}</span></td>
                      <td style={{ padding: 10 }}>
                        <button onClick={() => handleToggleStatus(user)} style={{ ...buttonStyle, background: user.isActive ? '#f59e0b' : '#10b981', marginRight: 4 }}>{user.isActive ? 'Khoa' : 'Mo khoa'}</button>
                        <button onClick={() => handleDelete(user._id)} style={{ ...buttonStyle, background: '#dc2626' }}>Xoa</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ color: '#64748b' }}>Hien thi {users.users.length} / {users.total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...buttonStyle, background: page <= 1 ? '#d1d5db' : '#6b7280' }}>Truoc</button>
                <span style={{ padding: '8px 12px' }}>Trang {page} / {users.totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= users.totalPages} style={{ ...buttonStyle, background: page >= users.totalPages ? '#d1d5db' : '#6b7280' }}>Sau</button>
              </div>
            </div>
          </>
        ) : <p style={{ textAlign: 'center', color: '#64748b' }}>Khong co nguoi dung</p>}
      </div>
    </div>
  );
};

export default AdminPage;
