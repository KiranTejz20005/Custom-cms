import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MappingTable from '../components/dashboard/MappingTable';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import { getMappings, deleteMapping, getSchools, getGrades } from '../services/api';
import { ChevronDown, Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Download, Users, School, Layers } from 'lucide-react';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [fetchError, setFetchError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        assetType: searchParams.get('assetType') || '',
        status: '',
        userType: '',
        gradeIds: [],
        schoolIds: []
    });

    const [schools, setSchools] = useState([]);
    const [grades, setGrades] = useState([]);
    const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const schoolDropdownRef = React.useRef(null);
    const gradeDropdownRef = React.useRef(null);

    useEffect(() => {
        const sortGradesAscending = (gradeList) => {
            return [...gradeList].sort((a, b) => {
                const aValue = Number(String(a?.name || a?.grade_name || a?.id || '').replace(/\D/g, ''));
                const bValue = Number(String(b?.name || b?.grade_name || b?.id || '').replace(/\D/g, ''));

                if (Number.isFinite(aValue) && Number.isFinite(bValue) && aValue !== bValue) {
                    return aValue - bValue;
                }

                return String(a?.name || a?.grade_name || a?.id || '').localeCompare(
                    String(b?.name || b?.grade_name || b?.id || '')
                );
            });
        };

        const fetchMeta = async () => {
            try {
                const [sRes, gRes] = await Promise.all([getSchools(), getGrades()]);
                setSchools(Array.isArray(sRes) ? sRes : (sRes.data || []));
                const rawGrades = Array.isArray(gRes) ? gRes : (gRes.data || []);
                setGrades(sortGradesAscending(rawGrades));
            } catch (err) {
                console.error("Meta fetch error", err);
            }
        };
        fetchMeta();

        const handleClickOutside = (event) => {
            if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target)) {
                setIsSchoolDropdownOpen(false);
            }
            if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target)) {
                setIsGradeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update internal state if URL changes
    useEffect(() => {
        const urlType = searchParams.get('assetType') || '';
        if (urlType !== filters.assetType) {
            setFilters(prev => ({ ...prev, assetType: urlType }));
        }
    }, [searchParams]);

    // Update URL if internal type changes
    const handleAssetTypeChange = (e) => {
        const val = e.target.value;
        setFilters({ ...filters, assetType: val });
        if (val) {
            setSearchParams({ assetType: val });
        } else {
            setSearchParams({});
        }
    };

    const normalizeContentType = (value) => {
        const normalized = String(value || '').trim().toLowerCase();
        const map = {
            courses: 'course',
            course: 'course',
            workshops: 'workshop',
            workshop: 'workshop',
            books: 'book',
            book: 'book',
            bytes: 'byte',
            byte: 'byte',
            categories: 'category',
            category: 'category',
            current_affairs: 'current_affairs',
            motivation: 'motivation'
        };
        return map[normalized] || normalized;
    };

    const normalizeId = (value) => {
        if (value == null) return null;
        if (typeof value === 'object') {
            const nested = value.id ?? value.school_id ?? null;
            const nestedNum = Number(nested);
            return Number.isFinite(nestedNum) && nestedNum > 0 ? nestedNum : null;
        }
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
    };

    const getRowSchoolIds = (row) => {
        if (!row) return [];
        const ids = [];

        if (Array.isArray(row.school_ids)) {
            row.school_ids.forEach((item) => {
                const parsed = normalizeId(item);
                if (parsed != null) ids.push(parsed);
            });
        }

        const singleSchoolId = normalizeId(row.school_id);
        if (singleSchoolId != null) ids.push(singleSchoolId);

        const schoolFromRef = normalizeId(row.school);
        if (schoolFromRef != null) ids.push(schoolFromRef);

        return [...new Set(ids)];
    };

    const isSchoolUserType = String(filters.userType || '').toLowerCase() === 'school';

    const loadData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await getMappings({
                limit: 1000, // Fetch more for client-side filtering
                offset: 0,
                search: filters.search || undefined,
            });

            // Xano can return { items: [...] } or { data: [...] } or a plain array
            let rows = [];
            if (Array.isArray(res)) {
                rows = res;
            } else if (Array.isArray(res?.items)) {
                rows = res.items;
            } else if (Array.isArray(res?.data)) {
                rows = res.data;
            }

            // Categories are helper selections, not standalone mappings in dashboard.
            rows = rows.filter(r => normalizeContentType(r.content_type || r.category) !== 'category');

            // Client-side search filter if search term provided
            if (filters.search) {
                const q = filters.search.toLowerCase();
                rows = rows.filter(r =>
                    (r.content_title || '').toLowerCase().includes(q) ||
                    (r.content_type || '').toLowerCase().includes(q) ||
                    (r.subscription_type || '').toLowerCase().includes(q)
                );
            }

            // Client-side active filter
            if (filters.status === 'active') {
                rows = rows.filter(r => r.is_active);
            }

            // Client-side asset type filter
            if (filters.assetType) {
                const wantedType = normalizeContentType(filters.assetType);
                rows = rows.filter(r => {
                    const recordType = normalizeContentType(r.content_type || r.category);
                    return recordType === wantedType;
                });
            }

            // User Type Filter
            if (filters.userType) {
                rows = rows.filter(r => {
                    const rType = (r.subscription_type || '').toLowerCase();
                    const fType = filters.userType.toLowerCase();
                    const rowSchoolIds = getRowSchoolIds(r);
                    // Match 'all' or specific types like 'premium', 'ultra', 'school'
                    if (fType === 'school') return rowSchoolIds.length > 0 || rType === 'school';
                    if (fType === 'premium') return rType === 'premium' && rowSchoolIds.length === 0;
                    if (fType === 'ultra') return rType === 'ultra' && rowSchoolIds.length === 0;
                    return rType.includes(fType);
                });
            }

            // Grade Filter
            if (filters.gradeIds.length > 0) {
                rows = rows.filter(r => {
                    // Check both grade_ids (array) and grade_id (single)
                    const rGrades = Array.isArray(r.grade_ids) ? r.grade_ids.map(Number) : (r.grade_id ? [Number(r.grade_id)] : []);
                    return filters.gradeIds.some(id => rGrades.includes(Number(id)));
                });
            }

            // School Filter
            if (isSchoolUserType && filters.schoolIds.length > 0) {
                const selectedSchoolIds = [...new Set(filters.schoolIds.map(Number).filter(Number.isFinite))];
                rows = rows.filter(r => {
                    const rowSchoolIds = getRowSchoolIds(r);
                    return selectedSchoolIds.some(id => rowSchoolIds.includes(id));
                });
            }

            setData(rows);
            setTotal(res?.total || rows.length);
        } catch (err) {
            console.error('Failed to load mappings', err);
            setFetchError(err.message || 'Failed to load mapped assets from Xano.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, filters.assetType, filters.status, filters.userType, filters.gradeIds, filters.schoolIds]);

    useEffect(() => {
        if (!toast) return undefined;
        const timeout = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timeout);
    }, [toast]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    const handleDelete = (mapping) => {
        setDeleteModal({
            isOpen: true,
            id: mapping.id,
            title: mapping.content_title || 'this mapping'
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        setDeletingId(deleteModal.id);
        try {
            await deleteMapping(deleteModal.id);
            setData(prev => prev.filter(m => m.id !== deleteModal.id));
            setTotal(prev => Math.max(0, prev - 1));
            setToast({ type: 'success', message: 'Mapping deleted successfully.' });
            setDeleteModal({ isOpen: false, id: null, title: '' });
        } catch (err) {
            setToast({ type: 'error', message: err.message || 'Failed to delete mapping.' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (id) => {
        navigate(`/admin/mappings/edit/${id}`);
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <Layout title="Mapped Assets Dashboard">
            <div className="dashboard-content">
                <header className="dashboard-header animate-fade-in">
                    <div className="header-text">
                        <h1>{searchParams.get('assetType') ? `${searchParams.get('assetType').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Mapping` : 'Mapped Assets'}</h1>
                        <p>Manage and monitor all {searchParams.get('assetType') ? searchParams.get('assetType').replace(/_/g, ' ') : 'course'}-to-audience assignments.</p>
                    </div>
                </header>

                <section className="filter-bar animate-fade-in glass" style={{ animationDelay: '0.1s' }}>
                    <form className="search-form" onSubmit={handleSearch}>
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search assets, audience..."
                            value={filters.search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFilters(prev => ({ ...prev, search: val }));
                            }}
                            onKeyUp={() => loadData()}
                        />
                    </form>

                    <div className="filter-group">
                        {!searchParams.get('assetType') && (
                            <div className="filter-item glass">
                                <Layers size={16} />
                                <select
                                    value={filters.assetType}
                                    onChange={handleAssetTypeChange}
                                >
                                    <option value="">All Assets</option>
                                    <option value="course">Courses</option>
                                    <option value="workshop">Workshops</option>
                                    <option value="book">Books</option>
                                    <option value="byte">Bytes</option>
                                </select>
                            </div>
                        )}

                        <div className="filter-item glass">
                            <Users size={16} />
                            <select
                                value={filters.userType}
                                onChange={(e) => {
                                    const nextUserType = e.target.value;
                                    const shouldShowSchoolDropdown = String(nextUserType || '').toLowerCase() === 'school';
                                    setFilters({
                                        ...filters,
                                        userType: nextUserType,
                                        schoolIds: shouldShowSchoolDropdown ? filters.schoolIds : []
                                    });
                                    if (!shouldShowSchoolDropdown) {
                                        setIsSchoolDropdownOpen(false);
                                    }
                                }}
                            >
                                <option value="">User Type</option>
                                <option value="all">All User Type</option>
                                <option value="Premium">Premium Type</option>
                                <option value="Ultra">Ultra Type</option>
                                <option value="School">Schools Type</option>
                            </select>
                        </div>

                        {/* School Dropdown */}
                        {isSchoolUserType && (
                            <div className="filter-item glass dropdown-container" ref={schoolDropdownRef}>
                                <div className="dropdown-trigger" onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}>
                                    <School size={14} />
                                    <span>{filters.schoolIds.length === 0 ? 'Select School' : `${filters.schoolIds.length} Schools`}</span>
                                    <ChevronDown size={14} />
                                </div>
                                {isSchoolDropdownOpen && (
                                    <div className="paged-dropdown-menu">
                                        <label className="menu-item-check all-option">
                                            <input
                                                type="checkbox"
                                                checked={filters.schoolIds.length === schools.length && schools.length > 0}
                                                onChange={(e) => {
                                                    setFilters({
                                                        ...filters,
                                                        schoolIds: e.target.checked ? schools.map(s => s.id) : []
                                                    });
                                                }}
                                            />
                                            <span>Select All</span>
                                        </label>
                                        <div className="dropdown-divider"></div>
                                        <div className="dropdown-options-list">
                                            {schools.map(s => (
                                                <label key={s.id} className="menu-item-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.schoolIds.map(Number).includes(Number(s.id))}
                                                        onChange={(e) => {
                                                            const cur = [...new Set(filters.schoolIds.map(Number).filter(Number.isFinite))];
                                                            const schoolId = Number(s.id);
                                                            setFilters({
                                                                ...filters,
                                                                schoolIds: e.target.checked ? [...cur, schoolId] : cur.filter(id => id !== schoolId)
                                                            });
                                                        }}
                                                    />
                                                    <span>{s.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Grade Dropdown */}
                        <div className="filter-item glass dropdown-container" ref={gradeDropdownRef}>
                            <div className="dropdown-trigger" onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}>
                                <Filter size={14} />
                                <span>{filters.gradeIds.length === 0 ? 'All Grades' : `${filters.gradeIds.length} Grades`}</span>
                                <ChevronDown size={14} />
                            </div>
                            {isGradeDropdownOpen && (
                                <div className="paged-dropdown-menu">
                                    <label className="menu-item-check all-option">
                                        <input
                                            type="checkbox"
                                            checked={filters.gradeIds.length === grades.length && grades.length > 0}
                                            onChange={(e) => {
                                                setFilters({
                                                    ...filters,
                                                    gradeIds: e.target.checked ? grades.map(g => g.id) : []
                                                });
                                            }}
                                        />
                                        <span>Select All</span>
                                    </label>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-options-list">
                                        {grades.map(g => (
                                            <label key={g.id} className="menu-item-check">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.gradeIds.includes(g.id)}
                                                    onChange={(e) => {
                                                        const cur = filters.gradeIds;
                                                        setFilters({
                                                            ...filters,
                                                            gradeIds: e.target.checked ? [...cur, g.id] : cur.filter(id => id !== g.id)
                                                        });
                                                    }}
                                                />
                                                <span>{g.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="filter-item glass">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active Only</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        <button className="icon-btn refresh glass" onClick={loadData} title="Refresh data">
                            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                        </button>
                    </div>
                </section>

                {toast && (
                    <div className={`action-toast ${toast.type === 'error' ? 'error' : 'success'}`}>
                        {toast.message}
                    </div>
                )}

                {fetchError && (
                    <div style={{
                        background: '#fef2f2', color: '#991b1b', padding: '14px 20px',
                        borderRadius: '10px', border: '1px solid #fecaca',
                        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500, fontSize: 14
                    }}>
                        ⚠️ Could not load entitlements: <b>{fetchError}</b>
                        <span style={{ marginLeft: 8, color: '#64748b', fontWeight: 400 }}>
                            → Make sure a <code>GET /get_entitlements</code> endpoint exists in your Xano API group.
                        </span>
                        <button onClick={loadData} style={{ marginLeft: 'auto', background: '#fca5a5', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', color: '#7f1d1d', fontWeight: 600 }}>Retry</button>
                    </div>
                )}

                <div className="dashboard-main animate-fade-in glass" style={{ animationDelay: '0.2s', padding: '1px', borderRadius: 'var(--radius-lg)' }}>
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Fetching mappings...</p>
                        </div>
                    ) : (
                        <>
                            <MappingTable
                                mappings={data}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                deletingId={deletingId}
                            />

                            <footer className="table-footer">
                                <div className="pagination-info">
                                    Showing <b>{(page - 1) * limit + 1} - {Math.min(page * limit, total)}</b> of <b>{total}</b> mappings
                                </div>

                                <div className="pagination-actions">
                                    <button
                                        className="pagi-btn"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="pagi-numbers">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                className={`pagi-num ${page === i + 1 ? 'active' : ''}`}
                                                onClick={() => setPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        className="pagi-btn"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </footer>
                        </>
                    )}
                </div>
            </div>

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => {
                    if (!deletingId) {
                        setDeleteModal({ isOpen: false, id: null, title: '' });
                    }
                }}
                title="Confirm Delete"
            >
                <div className="confirm-delete-content">
                    <p>Are you sure you want to delete this mapping? This cannot be undone.</p>
                    <p className="target-name">{deleteModal.title}</p>
                    <div className="confirm-delete-actions">
                        <button
                            className="btn-cancel"
                            onClick={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
                            disabled={Boolean(deletingId)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-delete"
                            onClick={confirmDelete}
                            disabled={Boolean(deletingId)}
                        >
                            {deletingId ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-text h1 {
          font-size: 32px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -1px;
          margin-bottom: 4px;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: white;
          padding: 12px 24px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          min-height: 64px;
          position: relative;
          z-index: 100;
        }

        .search-form {
          position: relative;
          flex: 0 1 320px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-form input {
          width: 100%;
          height: 40px;
          padding: 0 16px 0 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s;
        }

        .search-form input:focus {
          border-color: var(--primary);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: flex-end;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          height: 40px;
          padding: 0 12px;
          border-radius: 8px;
          color: #64748b;
          border: 1px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
          min-width: 130px;
        }

        .dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          width: 100%;
          justify-content: space-between;
        }

        .filter-item:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
          color: var(--text-main);
        }

        .filter-item select {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          width: 100%;
          height: 100%;
        }

        .filter-item.dropdown-container {
          position: relative;
        }

        .icon-btn.refresh {
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border: 1px solid transparent;
          color: #64748b;
          border-radius: 8px;
          transition: all 0.2s;
          padding: 0;
        }

        .icon-btn.refresh:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
          color: var(--primary);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 0;
          gap: 16px;
          color: var(--text-muted);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--primary-light);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          padding: 0 8px;
        }

        .pagination-info {
          font-size: 14px;
          color: var(--text-muted);
        }

        .pagination-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pagi-numbers {
          display: flex;
          gap: 6px;
        }

        .pagi-num {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: white;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
        }

        .pagi-num.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .pagi-num:not(.active):hover {
          background: #f1f5f9;
        }

        .pagi-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: white;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
        }

        .pagi-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }

        /* Dashboard Dropdown Styles */
        .dropdown-container {
            position: relative;
            cursor: pointer;
        }

        .dropdown-trigger {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }

        .paged-dropdown-menu {
            position: absolute;
            top: calc(100% + 12px);
            right: 0;
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 9999;
            min-width: 260px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-options-list {
            max-height: 250px;
            overflow-y: auto;
            padding: 4px;
        }

        .dropdown-divider {
            height: 1px;
            background: var(--border-color);
            margin: 4px 0;
        }

        .menu-item-check {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            cursor: pointer;
            font-size: 14px;
            color: var(--text-main);
            transition: all 0.2s;
        }

        .menu-item-check:hover {
            background: #f8fafc;
            color: var(--primary);
        }

        .menu-item-check.all-option {
            background: #f1f5f9;
            font-weight: 700;
            margin: 4px;
            border-radius: 8px;
        }

        .menu-item-check input {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--primary);
        }

                .action-toast {
                    margin: 16px 0;
                    padding: 12px 16px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    border: 1px solid;
                    animation: dropdownSlide 0.2s ease-out;
                }

                .action-toast.success {
                    background: #f0fdf4;
                    border-color: #86efac;
                    color: #166534;
                }

                .action-toast.error {
                    background: #fef2f2;
                    border-color: #fecaca;
                    color: #991b1b;
                }

                .confirm-delete-content p {
                    margin: 0;
                    color: var(--text-main);
                    font-size: 15px;
                }

                .confirm-delete-content .target-name {
                    margin-top: 8px;
                    color: var(--text-muted);
                    font-size: 13px;
                }

                .confirm-delete-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }

                .btn-cancel,
                .btn-delete {
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .btn-cancel {
                    background: white;
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                }

                .btn-delete {
                    background: #ef4444;
                    border: 1px solid #ef4444;
                    color: white;
                }

                .btn-cancel:disabled,
                .btn-delete:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
      ` }} />
        </Layout>
    );
};

export default DashboardPage;
