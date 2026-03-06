import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, EyeOff, Key, Save, X, Loader2, Users, School, Layers, Trash2, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal, ChevronDown, Filter, ArrowUpDown } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { getUsers, updateUser, getSchools, getGrades, deleteUser } from '../services/api';

const UsersPage = () => {
  const navigate = useNavigate();
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
  const [selectedType, setSelectedType] = useState('ultra');
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [appliedType, setAppliedType] = useState('ultra');
  const [appliedGrades, setAppliedGrades] = useState([]);
  const [appliedSchool, setAppliedSchool] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // Grades dropdown
  const [isGradesDropdownOpen, setIsGradesDropdownOpen] = useState(false);
  const gradesDropdownRef = useRef(null);

  // Columns chooser
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const columnsDropdownRef = useRef(null);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    type: true,
    grade: true,
    school: true,
    actions: true,
  });
  const columnLabels = {
    id: 'Student ID',
    name: 'Name',
    email: 'Email ID',
    type: 'Type',
    grade: 'Grade',
    school: 'School',
    actions: 'Actions',
  };

  // Sort
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gradesDropdownRef.current && !gradesDropdownRef.current.contains(e.target)) {
        setIsGradesDropdownOpen(false);
      }
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(e.target)) {
        setIsColumnsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await getUsers();
        const data = Array.isArray(res) ? res : (res.data || []);
        console.log('[UsersPage] Loaded users:', data.length, 'sample:', data[0]);
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

  // --- Stats (always computed from full users array) ---
  const ultraCount = users.filter(u => (u.subscription_type || u.type || '').toLowerCase() === 'ultra').length;
  const premiumCount = users.filter(u => (u.subscription_type || u.type || '').toLowerCase() === 'premium').length;
  const schoolCount = users.filter(u => Number(u.school || u.school_id || 0) !== 0).length;

  // --- Helpers (preserved) ---
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

  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };

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
      showToast("Password updated successfully!");
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error("Failed to update password:", err);
      showToast("Error updating password. Please try again.", "error");
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
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      showToast('User deleted successfully!', 'success');
    } catch (err) {
      console.error("Failed to delete user:", err);
      setIsDeleteModalOpen(false);
      showToast('Failed to delete user. Please try again.', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

  // --- Grades multi-select ---
  const toggleGrade = (gradeId) => {
    setSelectedGrades(prev =>
      prev.includes(gradeId) ? prev.filter(g => g !== gradeId) : [...prev, gradeId]
    );
  };
  const toggleAllGrades = () => {
    setSelectedGrades([]);
  };
  const gradesButtonLabel = () => {
    if (selectedGrades.length === 0) return 'All';
    if (selectedGrades.length <= 2) {
      return selectedGrades.map(id => {
        const g = grades.find(gr => gr.id === id);
        return g ? (g.grade_name || g.name) : id;
      }).join(', ');
    }
    return `${selectedGrades.length} Grades`;
  };

  // --- Column toggle ---
  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // --- Stat card click --- sets selectedType only, does not apply filter
  const handleStatClick = (type) => {
    setSelectedType(type);
  };

  // --- Sort + Filter ---
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    // Default: sort by id descending (newest first)
    return b.id - a.id;
  });

  const filteredUsers = sortedUsers.filter(user => {
    const matchesSearch = !search.trim() || (() => {
      const q = search.trim().toLowerCase();
      const userName = (user.name || '').toLowerCase();
      const userEmail = (user.email || '').toLowerCase();
      const userId = String(user.id || '');
      const userType = (user.subscription_type || '').toLowerCase();
      const isSchoolUser = Number(user.school || user.school_id || 0) !== 0;
      const typeLabel = isSchoolUser ? 'school' : userType;

      const gradeObj = grades.find(g =>
        Number(g.id) === Number(user.grade) ||
        Number(g.id) === Number(user.grade_id)
      );
      const gradeLabel = (gradeObj?.name || gradeObj?.grade || String(user.grade || '')).toLowerCase();

      const schoolObj = schools.find(s =>
        Number(s.id) === Number(user.school) ||
        Number(s.id) === Number(user.school_id)
      );
      const schoolLabel = (schoolObj?.name || '').toLowerCase();

      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        userId.includes(q) ||
        userType.includes(q) ||
        typeLabel.includes(q) ||
        gradeLabel.includes(q) ||
        schoolLabel.includes(q)
      );
    })();

    const userType = (user.subscription_type || user.type || '').toLowerCase();
    const isSchoolUser = Number(user.school || user.school_id || 0) !== 0;
    const filterType = (appliedType || '').toLowerCase();

    let matchesType = !filterType || filterType === 'all';
    if (!matchesType) {
      if (filterType === 'school') {
        matchesType = isSchoolUser;
      } else {
        matchesType = userType === filterType;
      }
    }

    const matchesGrades = appliedGrades.length === 0 ||
      appliedGrades.includes(Number(user.grade || user.grade_id));

    const matchesSchool = !appliedSchool ||
      Number(user.school || user.school_id) === Number(appliedSchool);

    return matchesSearch && matchesType && matchesSchool && matchesGrades;
  });

  // --- Pagination ---
  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) setTimeout(() => setCurrentPage(safePage), 0);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  // --- Submit / Reset handlers ---
  const isSubmitEnabled = () => true;

  const handleSubmitFilters = () => {
    setAppliedType(selectedType);
    setAppliedGrades(selectedGrades);
    setAppliedSchool(selectedSchool);
    setCurrentPage(1);
  };
  const handleResetFilters = () => {
    setSelectedType('ultra');
    setSelectedGrades([]);
    setSelectedSchool('');
    setAppliedType('ultra');
    setAppliedGrades([]);
    setAppliedSchool('');
    setSearch('');
    setCurrentPage(1);
  };

  // --- Sort toggle ---
  const handleNameSort = () => {
    if (sortBy === 'name') {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy('name');
      setSortOrder('asc');
    }
  };

  return (
    <Layout title="User Management">
      {/* ===== ROW 1: Title + New User ===== */}
      <div className="up-top-bar">
        <h2 className="up-title">Users</h2>
        <button className="up-btn-new" onClick={() => navigate('/admin/config/users/new')}>
          <Plus size={16} />
          <span>New user</span>
        </button>
      </div>

      {/* ===== ROW 2: Stats Cards ===== */}
      <div className="up-stats-row">
        <button
          className={`up-stat-card up-stat-ultra ${(selectedType || '').toLowerCase() === 'ultra' ? 'up-stat-active' : ''}`}
          onClick={() => handleStatClick('ultra')}
        >
          <span className="up-stat-num">{ultraCount}</span>
          <span className="up-stat-label">Ultra</span>
        </button>
        <button
          className={`up-stat-card up-stat-premium ${(selectedType || '').toLowerCase() === 'premium' ? 'up-stat-active' : ''}`}
          onClick={() => handleStatClick('premium')}
        >
          <span className="up-stat-num">{premiumCount}</span>
          <span className="up-stat-label">Premium</span>
        </button>
        <button
          className={`up-stat-card up-stat-school ${(selectedType || '').toLowerCase() === 'school' ? 'up-stat-active' : ''}`}
          onClick={() => handleStatClick('school')}
        >
          <span className="up-stat-num">{schoolCount}</span>
          <span className="up-stat-label">Schools</span>
        </button>
      </div>

      {/* ===== ROW 3: Filter Bar ===== */}
      <div className="up-filter-bar">
        <div className="up-filter-icon">
          <Filter size={18} />
        </div>

        {/* User Type */}
        <div className="up-filter-group">
          <span className="up-filter-group-label">User Type</span>
          <select
            className="up-filter-select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedSchool('');
            }}
          >
            <option value="">All Types</option>
            <option value="ultra">Ultra</option>
            <option value="premium">Premium</option>
            <option value="school">School</option>
          </select>
        </div>

        {/* School dropdown — shown first when school or all/empty */}
        {((selectedType || '').toLowerCase() === 'school' || (selectedType || '').toLowerCase() === '' || (selectedType || '').toLowerCase() === 'all') && (
          <>
            <div className="up-filter-divider" />
            <div className="up-filter-group">
              <span className="up-filter-group-label">School</span>
              <select
                className="up-filter-select"
                value={selectedSchool}
                onChange={(e) => { setSelectedSchool(e.target.value); }}
              >
                <option value="">All</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="up-filter-divider" />

        {/* Grades multi-select */}
        <div className="up-filter-group" ref={gradesDropdownRef}>
          <span className="up-filter-group-label">Grades</span>
          <button
            className="up-filter-select up-grades-toggle"
            onClick={() => setIsGradesDropdownOpen(prev => !prev)}
          >
            <span>{gradesButtonLabel()}</span>
            <ChevronDown size={14} className={`up-chev ${isGradesDropdownOpen ? 'up-chev-open' : ''}`} />
          </button>
          {isGradesDropdownOpen && (
            <div className="up-grades-dropdown">
              <label className="up-grades-item up-grades-all">
                <input type="checkbox" checked={selectedGrades.length === 0} onChange={toggleAllGrades} />
                <span>All Grades</span>
              </label>
              <div className="up-grades-divider" />
              {grades.map(grade => (
                <label key={grade.id} className="up-grades-item">
                  <input type="checkbox" checked={selectedGrades.includes(grade.id)} onChange={() => toggleGrade(grade.id)} />
                  <span>{grade.grade_name || grade.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit + Reset */}
        <button
          className="up-btn-submit"
          onClick={handleSubmitFilters}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >Submit</button>
        <button className="up-btn-reset" onClick={handleResetFilters}>Reset</button>
      </div>

      {/* ===== ROW 4: Showing / Search / Columns ===== */}
      <div className="up-toolbar-row">
        <div className="up-toolbar-left">
          <span className="up-showing-text">Showing</span>
          <select
            className="up-per-page-select"
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="up-showing-text">of {filteredUsers.length}</span>
        </div>

        <div className="up-toolbar-right">
          <div className="up-search-wrap">
            <Search size={16} className="up-search-icon" />
            <input
              type="text"
              className="up-search-input"
              placeholder="Search by name, ID, email, Grade, School, Type"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="up-columns-wrap" ref={columnsDropdownRef}>
            <button className="up-btn-columns" onClick={() => setIsColumnsDropdownOpen(prev => !prev)}>
              Columns
            </button>
            {isColumnsDropdownOpen && (
              <div className="up-columns-dropdown">
                {Object.keys(columnLabels).map(col => (
                  <label key={col} className="up-columns-item">
                    <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} />
                    <span>{columnLabels[col]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="up-table-container">
        {loading ? (
          <div className="up-empty-state">
            <Loader2 className="animate-spin" size={32} />
            <span>Retrieving users from Xano...</span>
          </div>
        ) : error ? (
          <div className="up-empty-state up-error">
            <span>{error}</span>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="up-empty-state">
            <span>No users found matching your filters.</span>
          </div>
        ) : (
          <table className="up-table">
            <thead>
              <tr>
                {visibleColumns.id && <th>ID</th>}
                {visibleColumns.name && (
                  <th className="up-sortable" onClick={handleNameSort}>
                    NAME
                    <ArrowUpDown size={13} className="up-sort-icon" />
                  </th>
                )}
                {visibleColumns.email && <th>EMAIL ADDRESS</th>}
                {visibleColumns.type && <th>TYPE</th>}
                {visibleColumns.grade && <th>GRADE</th>}
                {visibleColumns.school && <th>SCHOOL</th>}
                {visibleColumns.actions && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.id}>
                  {visibleColumns.id && <td className="up-id-col">#{user.id}</td>}
                  {visibleColumns.name && (
                    <td className="up-name-col">
                      <span
                        onClick={() => navigate(`/admin/config/users/${user.id}`)}
                        style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {user.name || 'No Name'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.email && (
                    <td className="up-email-col">
                      <div className="up-email-wrapper">
                        <span>{visibleEmails[user.id] ? user.email : maskEmail(user.email)}</span>
                        <button
                          className="up-toggle-vis"
                          onClick={() => toggleEmailVisibility(user.id)}
                          title={visibleEmails[user.id] ? "Hide Email" : "Show Email"}
                        >
                          {visibleEmails[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                  )}
                  {visibleColumns.type && (
                    <td>
                      <span className={`up-badge ${(user.subscription_type || user.type || 'free').toLowerCase()}`}>
                        {(user.subscription_type || user.type || 'Free').toUpperCase()}
                      </span>
                    </td>
                  )}
                  {visibleColumns.grade && (
                    <td>
                      {grades.find(g => Number(g.id) === Number(user.grade || user.grade_id))?.grade_name ||
                        grades.find(g => Number(g.id) === Number(user.grade || user.grade_id))?.name ||
                        user.grade || user.grade_id || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.school && (
                    <td className="up-school-col">
                      {schools.find(s => Number(s.id) === Number(user.school || user.school_id))?.name ||
                        user.school || user.school_id || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td>
                      <div className="up-actions">
                        <button className="up-act-btn up-act-edit" onClick={() => navigate(`/admin/config/users/${user.id}`)} title="Edit User">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button className="up-act-btn up-act-delete" onClick={() => openDeleteModal(user)} title="Delete User">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {!loading && !error && totalFiltered > 0 && (
        <div className="up-pagination">
          <div />
          <div className="up-pagination-controls">
            <button className="up-page-btn" disabled={safePage <= 1} onClick={() => setCurrentPage(1)} title="First">
              <ChevronsLeft size={15} />
            </button>
            <button className="up-page-btn" disabled={safePage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} title="Previous">
              <ChevronLeft size={15} />
            </button>
            <span className="up-page-num">{safePage}</span>
            <button className="up-page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} title="Next">
              <ChevronRight size={15} />
            </button>
            <button className="up-page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)} title="Last">
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL (preserved) ===== */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="delete-modal-content">
          <p>Are you sure you want to delete the user <strong>{userToDelete?.name || userToDelete?.email}</strong>?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)} disabled={deletingUser}>Cancel</button>
            <button className="btn-delete" onClick={handleDeleteUser} disabled={deletingUser}>
              {deletingUser ? <Loader2 className="animate-spin" size={16} /> : "Delete User"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== PASSWORD MODAL (preserved) ===== */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change User Password">
        <div className="password-modal-content">
          <p className="modal-desc">Update password for <strong>{currentUser?.name || currentUser?.email}</strong>.</p>
          <div className="input-group">
            <label>New Password</label>
            <input type="password" placeholder="Minimum 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>
              <X size={16} /><span>Cancel</span>
            </button>
            <button className="btn btn-primary" onClick={handlePasswordChange} disabled={savingPassword}>
              {savingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== STYLES ===== */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* ====== TOP BAR ====== */
        .up-top-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .up-title {
          font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;
        }
        .up-btn-new {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 22px;
          background: #3b5bdb; color: #fff; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .up-btn-new:hover { background: #364fc7; }

        /* ====== STATS ROW ====== */
        .up-stats-row {
          display: flex; gap: 14px; margin-bottom: 18px;
        }
        .up-stat-card {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 14px 32px; border-radius: 10px;
          border: 2px solid transparent; background: #fff; cursor: pointer;
          transition: all 0.15s; min-width: 100px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .up-stat-card:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.08); }
        .up-stat-num { font-size: 22px; font-weight: 700; color: #1e293b; line-height: 1.2; }
        .up-stat-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: capitalize; }

        /* Card color variants */
        .up-stat-ultra { border-color: #fde68a; background: #fffbeb; }
        .up-stat-ultra .up-stat-num { color: #92400e; }
        .up-stat-ultra .up-stat-label { color: #92400e; }
        .up-stat-ultra.up-stat-active { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 0 0 2px rgba(245,158,11,0.15); }
        .up-stat-premium { border-color: #93c5fd; background: #eff6ff; }
        .up-stat-premium .up-stat-num { color: #1e40af; }
        .up-stat-premium .up-stat-label { color: #1e40af; }
        .up-stat-premium.up-stat-active { border-color: #3b82f6; background: #eff6ff; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
        .up-stat-school { border-color: #d1d5db; background: #f9fafb; }
        .up-stat-school .up-stat-num { color: #374151; }
        .up-stat-school .up-stat-label { color: #374151; }
        .up-stat-school.up-stat-active { border-color: #6b7280; background: #f3f4f6; box-shadow: 0 0 0 2px rgba(107,114,128,0.15); }

        /* ====== FILTER BAR ====== */
        .up-filter-bar {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 20px;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .up-filter-icon { color: #64748b; display: flex; align-items: center; }
        .up-filter-divider {
          width: 1px; height: 28px; background: #e2e8f0; flex-shrink: 0;
        }
        .up-filter-group {
          display: flex; align-items: center; gap: 8px; position: relative;
        }
        .up-filter-group-label {
          font-size: 13px; font-weight: 600; color: #475569; white-space: nowrap;
        }
        .up-filter-select {
          border: 1px solid #e2e8f0; border-radius: 6px;
          padding: 6px 12px; font-size: 13px; font-weight: 500;
          color: #334155; background: #f8fafc; cursor: pointer; outline: none;
          min-width: 80px; transition: border-color 0.15s;
        }
        .up-filter-select:focus { border-color: #6366f1; }

        /* Submit + Reset buttons */
        .up-btn-submit {
          padding: 7px 20px; border: none; border-radius: 6px;
          background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .up-btn-submit:hover { background: #2563eb; }
        .up-btn-reset {
          padding: 7px 20px; border: 1px solid #d1d5db; border-radius: 6px;
          background: #fff; color: #374151; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .up-btn-reset:hover { background: #f9fafb; }

        /* Grades toggle button */
        .up-grades-toggle {
          display: flex; align-items: center; gap: 6px; user-select: none;
          min-width: 80px;
        }
        .up-chev { transition: transform 0.2s; color: #94a3b8; }
        .up-chev-open { transform: rotate(180deg); }

        .up-grades-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 6px 0;
          z-index: 200; min-width: 180px; max-height: 280px; overflow-y: auto;
        }
        .up-grades-item {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 14px; cursor: pointer; font-size: 13px; color: #334155;
          transition: background 0.1s;
        }
        .up-grades-item:hover { background: #f8fafc; }
        .up-grades-item input[type="checkbox"] { accent-color: #6366f1; width: 15px; height: 15px; cursor: pointer; }
        .up-grades-all { font-weight: 600; }
        .up-grades-divider { height: 1px; background: #f1f5f9; margin: 3px 0; }

        /* ====== TOOLBAR ROW (Showing / Search / Columns) ====== */
        .up-toolbar-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; gap: 16px; flex-wrap: wrap;
        }
        .up-toolbar-left {
          display: flex; align-items: center; gap: 8px;
        }
        .up-showing-text { font-size: 13px; color: #64748b; }
        .up-showing-text strong { color: #1e293b; }
        .up-per-page-select {
          padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 5px;
          font-size: 13px; font-weight: 500; background: #fff; cursor: pointer; outline: none;
        }
        .up-toolbar-right {
          display: flex; align-items: center; gap: 10px;
        }
        .up-search-wrap {
          position: relative; min-width: 260px;
        }
        .up-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;
        }
        .up-search-input {
          width: 100%; padding: 8px 14px 8px 36px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; background: #fff; outline: none; transition: border-color 0.15s;
        }
        .up-search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.08); }

        /* Columns button */
        .up-columns-wrap { position: relative; }
        .up-btn-columns {
          padding: 8px 18px; border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; font-weight: 500; background: #fff; color: #334155;
          cursor: pointer; transition: all 0.15s;
        }
        .up-btn-columns:hover { border-color: #6366f1; color: #6366f1; }
        .up-columns-dropdown {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 6px 0;
          z-index: 200; min-width: 170px;
        }
        .up-columns-item {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 14px; cursor: pointer; font-size: 13px; color: #334155;
          transition: background 0.1s;
        }
        .up-columns-item:hover { background: #f8fafc; }
        .up-columns-item input[type="checkbox"] { accent-color: #6366f1; width: 15px; height: 15px; cursor: pointer; }

        /* ====== TABLE ====== */
        .up-table-container {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
        }
        .up-table {
          width: 100%; border-collapse: collapse; text-align: left;
        }
        .up-table th {
          background: #f8fafc; padding: 14px 20px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .up-sortable {
          cursor: pointer; user-select: none; display: flex; align-items: center; gap: 4px;
        }
        .up-sortable:hover { color: #3b5bdb; }
        .up-sort-icon { opacity: 0.5; }
        .up-table td {
          padding: 14px 20px; font-size: 14px; color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        .up-table tbody tr:hover { background: #fafbfe; }
        .up-id-col { color: #94a3b8; font-family: monospace; }
        .up-name-col { font-weight: 600; }
        .up-school-col {
          max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Email */
        .up-email-wrapper { display: flex; align-items: center; gap: 8px; }
        .up-toggle-vis {
          background: none; border: none; color: #94a3b8; padding: 3px;
          cursor: pointer; transition: color 0.15s; border-radius: 4px;
        }
        .up-toggle-vis:hover { color: #6366f1; background: #f1f5f9; }

        /* Badges */
        .up-badge {
          padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.02em;
        }
        .up-badge.ultra { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .up-badge.premium { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .up-badge.school { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .up-badge.free { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

        /* Actions */
        .up-actions { display: flex; gap: 8px; }
        .up-act-btn {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 6px; border: none;
          cursor: pointer; transition: all 0.15s;
        }
        .up-act-edit { background: #eef2ff; color: #6366f1; }
        .up-act-edit:hover { background: #6366f1; color: #fff; }
        .up-act-delete { background: #fef2f2; color: #ef4444; }
        .up-act-delete:hover { background: #ef4444; color: #fff; }

        /* Empty / loading */
        .up-empty-state {
          padding: 80px 0; display: flex; flex-direction: column;
          align-items: center; gap: 14px; color: #94a3b8;
        }
        .up-error { color: #ef4444; }

        /* ====== PAGINATION ====== */
        .up-pagination {
          display: flex; align-items: center; justify-content: flex-end;
          margin-top: 14px; padding: 6px 0;
        }
        .up-pagination-controls {
          display: flex; align-items: center; gap: 2px;
        }
        .up-page-btn {
          width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
          border: 1px solid #e2e8f0; border-radius: 5px; background: #fff;
          color: #64748b; cursor: pointer; transition: all 0.12s;
        }
        .up-page-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
        .up-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .up-page-num {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border: 1px solid #3b5bdb;
          border-radius: 5px; background: #eef2ff;
          font-size: 13px; font-weight: 600; color: #3b5bdb;
        }

        /* ====== MODAL STYLES (preserved) ====== */
        .delete-modal-content { padding: 8px; }
        .warning-text { color: #ef4444; font-size: 13px; margin-top: 8px; font-weight: 500; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .btn-cancel {
          padding: 8px 16px; border-radius: 6px; background: #f3f4f6;
          border: 1px solid #e5e7eb; cursor: pointer;
        }
        .btn-delete {
          padding: 8px 16px; border-radius: 6px; background: #ef4444;
          color: white; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-delete:hover { background: #dc2626; }
        .btn-delete:disabled { opacity: 0.7; cursor: not-allowed; }
        .password-modal-content { display: flex; flex-direction: column; gap: 20px; }
        .modal-desc { font-size: 14px; color: #64748b; line-height: 1.5; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 12px; font-weight: 600; color: #475569; }
        .input-group input {
          padding: 12px 16px; border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px; font-size: 14px; outline: none;
        }
        .input-group input:focus {
          border-color: var(--primary, #6366f1);
          box-shadow: 0 0 0 2px rgba(99,102,241,0.1);
        }
        /* Modal overlay fix */
        .modal-overlay {
          background: rgba(0, 0, 0, 0.5) !important;
        }
      `}} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
};

export default UsersPage;
