import React, { useState, useEffect } from 'react';
import { Search, User, Eye, EyeOff, Key, Save, X, Loader2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import { getUsers, updateUser } from '../services/api';

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

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await getUsers();
                // Adjust for potential array vs data.data response structure
                const data = Array.isArray(res) ? res : (res.data || []);
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch users", err);
                setError("Error loading users. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
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

    const filteredUsers = users.filter(user =>
        (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout title="User Management">
            <div className="users-page-header">
                <div className="search-container glass-light">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={handleSearchChange}
                    />
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
                                    <td className="actions-col">
                                        <button
                                            className="btn-action reset-btn"
                                            onClick={() => openPasswordModal(user)}
                                        >
                                            <Key size={14} />
                                            <span>Reset Password</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

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
          margin-bottom: 32px;
        }

        .search-container {
          position: relative;
          max-width: 400px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-container input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border: none;
          background: transparent;
          font-size: 14px;
          outline: none;
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
      ` }} />
        </Layout>
    );
};

export default UsersPage;
