import React, { useState, useEffect } from 'react';
import { Search, User, Eye, EyeOff, Key, Save, X, Loader2, Users, School, RefreshCw, Layers, Trash2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import { getUsers, updateUser, getSchools, getGrades, deleteUser } from '../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [visibleEmails, setVisibleEmails] = useState({});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [schools, setSchools] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await getUsers();
        const data = Array.isArray(res) ? res : (res.data || []);
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setError("Error loading users. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchMeta = async () => {
      try {
        const [sRes, gRes] = await Promise.all([getSchools(), getGrades()]);
        setSchools(Array.isArray(sRes) ? sRes : (sRes.data || []));
        const gData = Array.isArray(gRes) ? gRes : (gRes.data || []);
        setGrades([...gData].sort((a, b) => Number(a.id) - Number(b.id)));
      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };

    fetchUsers();
    fetchMeta();
  }, []);

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const start = user.slice(0, 2);
    return `${start}****@${domain}`;
  };

  const toggleEmailVisibility = (id) => {
    setVisibleEmails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  const openPasswordModal = (user) => {
    setCurrentUser(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      await updateUser(currentUser.id, { password: newPassword });
      alert("Password updated successfully!");
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error("Failed to update password:", err);
      alert("Error updating password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      alert("User deleted successfully!");
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Error deleting user. Please try again.");
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase());

    const userType = (user.subscription_type || user.type || '').toLowerCase();
    const isSchoolUser = Number(user.school || user.school_id || 0) !== 0;

    let matchesType = !selectedType || selectedType === 'all';
    if (!matchesType) {
      if (selectedType === 'School') {
        matchesType = isSchoolUser;
      } else {
        matchesType = userType === selectedType.toLowerCase();
      }
    }

    const matchesGrade = !selectedGrade ||
      Number(user.grade || user.grade_id) === Number(selectedGrade);

    const matchesSchool = !selectedSchool ||
      Number(user.school || user.school_id) === Number(selectedSchool);

    return matchesSearch && matchesType && matchesSchool && matchesGrade;
  });

  return (
    <Layout title="User Management">
      <div className="users-page-header glass animate-fade-in">
        <div className="filter-bar">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group-horizontal">
            <div className="filter-item-container">
              <label className="filter-label">User Type</label>
              <div className="filter-item">
                <Users size={16} />
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setSelectedSchool('');
                    setSelectedGrade('');
                  }}
                >
                  <option value="" hidden>User Type</option>
                  <option value="">All Types</option>
                  <option value="Premium">Premium</option>
                  <option value="Ultra">Ultra</option>
                  <option value="School">School</option>
                </select>
              </div>
            </div>

            {selectedType === 'School' && (
              <div className="filter-item-container animate-slide-in">
                <label className="filter-label">Select School</label>
                <div className="filter-item">
                  <School size={16} />
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                  >
                    <option value="">Choose School...</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(selectedType !== '' && (selectedType !== 'School' || selectedSchool !== '')) && (
              <div className="filter-item-container animate-slide-in">
                <label className="filter-label">Select Grade</label>
                <div className="filter-item">
                  <Layers size={16} />
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="">Choose Grade...</option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.grade_name || grade.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button className="icon-btn refresh" onClick={() => window.location.reload()} title="Refresh Data" style={{ marginTop: '24px' }}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="user-table-container glass">
        {loading ? (
          <div className="empty-state">
            <Loader2 className="animate-spin" size={32} />
            <span>Retrieving users from Xano...</span>
          </div>
        ) : error ? (
          <div className="empty-state error">
            <span>{error}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <span>No users found Matching your search.</span>
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Type</th>
                <th>Grade</th>
                <th>School</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="id-col">#{user.id}</td>
                  <td className="name-col">{user.name || 'No Name'}</td>
                  <td className="email-col">
                    <div className="email-wrapper">
                      <span>{visibleEmails[user.id] ? user.email : maskEmail(user.email)}</span>
                      <button
                        className="toggle-visibility"
                        onClick={() => toggleEmailVisibility(user.id)}
                        title={visibleEmails[user.id] ? "Hide Email" : "Show Email"}
                      >
                        {visibleEmails[user.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                  <td className="type-col">
                    <span className={`badge-type ${(user.subscription_type || user.type || 'free').toLowerCase()}`}>
                      {user.subscription_type || user.type || 'Free'}
                    </span>
                  </td>
                  <td className="grade-col">
                    {grades.find(g => Number(g.id) === Number(user.grade || user.grade_id))?.grade_name ||
                      grades.find(g => Number(g.id) === Number(user.grade || user.grade_id))?.name ||
                      user.grade || user.grade_id || 'N/A'}
                  </td>
                  <td className="school-col">
                    {schools.find(s => Number(s.id) === Number(user.school || user.school_id))?.name ||
                      user.school || user.school_id || 'N/A'}
                  </td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      <button
                        className="btn-action reset-btn"
                        onClick={() => openPasswordModal(user)}
                        title="Reset Password"
                      >
                        <Key size={14} />
                      </button>
                      <button
                        className="btn-action delete-btn"
                        onClick={() => openDeleteModal(user)}
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="delete-modal-content">
          <p>Are you sure you want to delete the user <strong>{userToDelete?.name || userToDelete?.email}</strong>?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-actions">
            <button
              className="btn-cancel"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deletingUser}
            >
              Cancel
            </button>
            <button
              className="btn-delete"
              onClick={handleDeleteUser}
              disabled={deletingUser}
            >
              {deletingUser ? <Loader2 className="animate-spin" size={16} /> : "Delete User"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change User Password"
      >
        <div className="password-modal-content">
          <p className="modal-desc">
            Update password for <strong>{currentUser?.name || currentUser?.email}</strong>.
          </p>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePasswordChange}
              disabled={savingPassword}
            >
              {savingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .users-page-header {
          margin-bottom: 24px;
          border-radius: var(--radius-lg);
          padding: 1px;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          gap: 16px;
          min-height: 64px;
        }

        .search-container {
          position: relative;
          max-width: 400px;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-container input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: white;
          font-size: 14px;
          height: 40px;
          outline: none;
          transition: all 0.2s;
        }

        .search-container input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        .filter-group-horizontal {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-item-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-left: 2px;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #f1f5f9;
          transition: all 0.2s;
          min-width: 200px;
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-item:focus-within {
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05);
        }

        .filter-item select {
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          width: 100%;
          outline: none;
          cursor: pointer;
        }

        .filter-item:hover {
          border-color: #cbd5e1;
        }

        .filter-item select {
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
          min-width: 120px;
        }

        .icon-btn.refresh {
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn.refresh:hover {
          background: #f8fafc;
          color: var(--primary);
          border-color: var(--primary);
        }

        .user-table-container {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: white;
          border: 1px solid var(--border-color);
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .user-table th {
          background: #f8fafc;
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          border-bottom: 1px solid var(--border-color);
        }

        .user-table td {
          padding: 16px 24px;
          font-size: 14px;
          color: var(--text-main);
          border-bottom: 1px solid var(--border-color);
        }

        .id-col {
          color: #94a3b8;
          font-family: var(--font-mono);
          width: 80px;
        }

        .name-col {
          font-weight: 600;
        }

        .email-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-visibility {
          background: none;
          border: none;
          color: #94a3b8;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-visibility:hover {
          color: var(--primary);
          background: #f1f5f9;
          border-radius: 4px;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
        }

        .reset-btn {
          background: #eef2ff;
          color: var(--primary);
          border: 1px solid transparent;
        }

        .reset-btn:hover {
          background: var(--primary);
          color: white;
        }

        .empty-state {
          padding: 80px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #94a3b8;
        }

        .error {
          color: #ef4444;
        }

        .password-modal-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-desc {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .input-group input {
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }

        .input-group input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }
        .school-col {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-action.delete-btn {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
        }

        .btn-action.delete-btn:hover {
          background: #fee2e2;
          transform: translateY(-2px);
        }

        .delete-modal-content {
          padding: 8px;
        }

        .warning-text {
          color: #ef4444;
          font-size: 13px;
          margin-top: 8px;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-cancel {
          padding: 8px 16px;
          border-radius: 6px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          cursor: pointer;
        }

        .btn-delete {
          padding: 8px 16px;
          border-radius: 6px;
          background: #ef4444;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .btn-delete:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .badge-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-type.premium { background: #e0f2fe; color: #0369a1; }
        .badge-type.ultra { background: #fef3c7; color: #92400e; }
        .badge-type.school { background: #f1f5f9; color: #475569; }
        .badge-type.free { background: #f3f4f6; color: #374151; }
      ` }} />
    </Layout>
  );
};

export default UsersPage;
