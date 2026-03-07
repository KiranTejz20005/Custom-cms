import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import MappingTable from '../components/dashboard/MappingTable';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import AdminDeleteModal from '../components/common/AdminDeleteModal';
import { getMappings, deleteMapping, deleteCourse, getSchools, getGrades, getCourses } from '../services/api';
import { ChevronDown, Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Download, Users, School, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [fetchError, setFetchError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
    const [deletingId, setDeletingId] = useState(null);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        assetType: searchParams.get('assetType') || '',
        category: searchParams.get('category') ? searchParams.get('category').split(',') : ['All'],
        userType: searchParams.get('userType') || '',
        gradeIds: searchParams.get('gradeIds') ? searchParams.get('gradeIds').split(',').map(Number) : [],
        schoolIds: searchParams.get('schoolIds') ? searchParams.get('schoolIds').split(',').map(Number) : []
    });

    // Auto-pre-fill search from URL and submit
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchParam = params.get('search');
        if (searchParam) {
            setFilters(prev => ({ ...prev, search: searchParam }));
            setHasSubmitted(true);
        }
    }, [location.search]);

    const [schools, setSchools] = useState([]);
    const [grades, setGrades] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const [isUserTypeDropdownOpen, setIsUserTypeDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

    const [hasSubmitted, setHasSubmitted] = useState(!!searchParams.get('search'));

    const schoolDropdownRef = React.useRef(null);
    const gradeDropdownRef = React.useRef(null);
    const userTypeDropdownRef = React.useRef(null);
    const categoryDropdownRef = React.useRef(null);
    const statusDropdownRef = React.useRef(null);
    const assetDropdownRef = React.useRef(null);

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
            if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target)) setIsSchoolDropdownOpen(false);
            if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target)) setIsGradeDropdownOpen(false);
            if (userTypeDropdownRef.current && !userTypeDropdownRef.current.contains(event.target)) setIsUserTypeDropdownOpen(false);
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) setIsCategoryDropdownOpen(false);
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) setIsStatusDropdownOpen(false);
            if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target)) setIsAssetDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update internal state if URL changes
    useEffect(() => {
        const urlType = searchParams.get('assetType') || '';
        const urlSearch = searchParams.get('search') || '';
        const urlCategory = searchParams.get('category') ? searchParams.get('category').split(',') : ['All'];
        const urlUserType = searchParams.get('userType') || '';
        const urlGradeIds = searchParams.get('gradeIds') ? searchParams.get('gradeIds').split(',').map(Number) : [];
        const urlSchoolIds = searchParams.get('schoolIds') ? searchParams.get('schoolIds').split(',').map(Number) : [];

        setFilters({
            search: urlSearch,
            assetType: urlType,
            category: urlCategory,
            userType: urlUserType,
            gradeIds: urlGradeIds,
            schoolIds: urlSchoolIds
        });

        const isUrlFormComplete = urlType && urlUserType && (urlUserType.toLowerCase() !== 'school' || urlSchoolIds.length > 0) && urlGradeIds.length > 0;

        if (urlSearch || isUrlFormComplete) {
            setHasSubmitted(true);
        } else {
            setHasSubmitted(false);
            setData([]); // Clear data if filters are reset or incomplete
        }
    }, [searchParams]);

    // Fetch context-aware categories when asset type changes
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getMappings({ limit: 1000 });
                const rows = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : (res?.data || []));

                const wantedType = normalizeContentType(filters.assetType);
                const filteredRows = wantedType
                    ? rows.filter(r => normalizeContentType(r.content_type || r.category) === wantedType)
                    : rows;

                const uniqueCategories = ['All', ...new Set(filteredRows.map(r => r.category).filter(Boolean).filter(c => c !== 'All'))];
                setCategories(uniqueCategories);
            } catch (e) {
                console.error("Failed to fetch category names", e);
            }
        };
        fetchCategories();
    }, [filters.assetType]);

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
        if (!hasSubmitted && !filters.search) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setFetchError(null);
        try {
            const [res, coursesRes] = await Promise.all([
                getMappings({
                    limit: 1000, // Fetch more for client-side filtering
                    offset: 0,
                    search: filters.search || undefined,
                }),
                getCourses()
            ]);

            // Xano can return { items: [...] } or { data: [...] } or a plain array
            let rows = [];
            if (Array.isArray(res)) {
                rows = res;
            } else if (Array.isArray(res?.items)) {
                rows = res.items;
            } else if (Array.isArray(res?.data)) {
                rows = res.data;
            }

            // Build course id -> category map (course table has A_category or category e.g. "Foundations")
            const courseList = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.data ?? coursesRes?.items ?? []);
            const courseCategoryByContentId = {};
            (courseList || []).forEach(c => {
                const id = c.id ?? c.course_id;
                const category = c.category ?? c.A_category ?? c.category_name;
                if (id != null && category != null) courseCategoryByContentId[String(id)] = category;
            });

            // Enrich course mappings with category from course table so CMS shows "Foundations" etc., not "course"
            rows = rows.map(r => {
                if (normalizeContentType(r.content_type) === 'course' && !(r.category ?? r.category_name ?? r.content_category ?? r.course_category)) {
                    const contentId = String(r.content_id ?? r.course_id ?? '');
                    const fromCourse = courseCategoryByContentId[contentId];
                    if (fromCourse) return { ...r, category: fromCourse };
                }
                return r;
            });

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

            // Client-side category filter
            if (filters.category && filters.category.length > 0 && !filters.category.includes('All')) {
                rows = rows.filter(r => filters.category.includes(r.category));
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
                    if (fType === 'premium') return rType === 'premium';
                    if (fType === 'ultra') return rType === 'ultra';
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

            // Sort so latest first (by created_at desc, then id desc)
            rows = [...rows].sort((a, b) => {
                const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                if (bTime !== aTime) return bTime - aTime;
                return (Number(b.id) || 0) - (Number(a.id) || 0);
            });

            // Deduplicate by course content_id — keep only one row per course
            const seen = new Set();
            rows = rows.filter(r => {
                const courseId = r.content_id || r.course_id || r.id;
                if (seen.has(String(courseId))) return false;
                seen.add(String(courseId));
                return true;
            });

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
        if (hasSubmitted) {
            loadData();
        }
    }, [page, filters.assetType, hasSubmitted]);

    const handleSearch = (e) => {
        e.preventDefault();
        setHasSubmitted(true);
        loadData();
    };

    const isPremiumOrUltra = String(filters.userType || '').toLowerCase() === 'premium' || String(filters.userType || '').toLowerCase() === 'ultra';

    // Step-by-step logic
    const canShowSchool = isSchoolUserType;
    const canShowGrades = (isSchoolUserType && filters.schoolIds.length > 0) || (filters.userType !== '' && !isSchoolUserType);
    const canShowCategory = filters.gradeIds.length > 0;

    // Form completeness validation
    const isFormComplete =
        filters.userType !== '' &&
        (!isSchoolUserType || filters.schoolIds.length > 0) &&
        filters.gradeIds.length > 0 &&
        filters.category.length > 0;

    const isAnyFilterSelected = filters.userType !== '' || filters.schoolIds.length > 0 || filters.gradeIds.length > 0 || (filters.category.length > 0 && !filters.category.includes('All'));

    const handleSubmit = () => {
        if (!isFormComplete) return;

        // Sync filters to URL
        const params = new URLSearchParams();
        if (filters.assetType) params.set('assetType', filters.assetType);
        if (filters.search) params.set('search', filters.search);
        if (filters.userType) params.set('userType', filters.userType);
        if (filters.gradeIds.length) params.set('gradeIds', filters.gradeIds.join(','));
        if (filters.schoolIds.length) params.set('schoolIds', filters.schoolIds.join(','));
        if (filters.category.length && !filters.category.includes('All')) params.set('category', filters.category.join(','));

        setSearchParams(params);
        setHasSubmitted(true);
        loadData();
    };

    const handleDelete = (mapping) => {
        const courseId = Number(mapping.course) || Number(mapping.content_id) || Number(mapping.id);
        setDeleteModal({
            isOpen: true,
            id: courseId,
            title: mapping.content_title || 'this mapping'
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        setDeletingId(deleteModal.id);
        try {
            await deleteCourse(deleteModal.id);

            // Remove from local state immediately
            setData(prev => prev.filter(m => {
                const cid = Number(m.course) || Number(m.content_id) || Number(m.id);
                return cid !== deleteModal.id;
            }));
            setTotal(prev => Math.max(0, prev - 1));

            toast.success('Course moved to bin successfully.');
            setDeleteModal({ isOpen: false, id: null, title: '' });

            // Reload fresh data from server
            await loadData();
        } catch (err) {
            toast.error(err.message || 'Failed to delete course.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (id) => {
        navigate(`/admin/courses/edit/${id}`);
    };

    const isDashboardHome = !searchParams.get('assetType');

    if (isDashboardHome) {
        return (
            <Layout title="Mapped Assets Dashboard">
                <div className="dashboard-coming-soon">
                    <div className="dashboard-coming-soon-card">
                        <span className="coming-soon-kicker">Dashboard</span>
                        <h1>New dashboard experience is coming soon</h1>
                        <p>
                            We are preparing insights, trend tracking, and better audience visibility.
                            Until then, continue using Courses and Workshops from the left menu.
                        </p>

                        <div className="coming-soon-points">
                            <span>Live metrics</span>
                            <span>Audience insights</span>
                            <span>Performance trends</span>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                                            .dashboard-coming-soon {
                                                min-height: 72vh;
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                justify-content: center;
                                                padding: 20px;
                                            }

                                            .dashboard-coming-soon-card {
                                                width: min(760px, 100%);
                                                background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
                                                border: 1px solid var(--border-color);
                                                border-radius: 18px;
                                                box-shadow: var(--shadow-sm);
                                                padding: 56px 42px;
                                                text-align: center;
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                gap: 16px;
                                            }

                                            .coming-soon-kicker {
                                                display: inline-flex;
                                                align-items: center;
                                                justify-content: center;
                                                height: 30px;
                                                padding: 0 14px;
                                                border-radius: 999px;
                                                background: #eef2ff;
                                                border: 1px solid #c7d2fe;
                                                color: #4338ca;
                                                font-size: 12px;
                                                font-weight: 700;
                                                text-transform: uppercase;
                                                letter-spacing: 0.08em;
                                            }

                                            .dashboard-coming-soon h1 {
                                                margin: 0;
                                                font-size: 36px;
                                                font-weight: 800;
                                                color: var(--text-main);
                                                letter-spacing: -0.8px;
                                                line-height: 1.2;
                                                max-width: 620px;
                                            }

                                            .dashboard-coming-soon p {
                                                margin: 0;
                                                font-size: 16px;
                                                color: var(--text-muted);
                                                font-weight: 500;
                                                line-height: 1.7;
                                                max-width: 640px;
                                            }

                                            .coming-soon-points {
                                                margin-top: 8px;
                                                display: flex;
                                                flex-wrap: wrap;
                                                align-items: center;
                                                justify-content: center;
                                                gap: 10px;
                                            }

                                            .coming-soon-points span {
                                                display: inline-flex;
                                                align-items: center;
                                                height: 30px;
                                                padding: 0 12px;
                                                border-radius: 999px;
                                                background: #f1f5f9;
                                                border: 1px solid #e2e8f0;
                                                color: #334155;
                                                font-size: 12px;
                                                font-weight: 700;
                                                white-space: nowrap;
                                            }
                                        `,
                }} />
            </Layout>
        );
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <Layout title="Mapped Assets Dashboard">
            <div className="dashboard-content">

                <header className="dashboard-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div className="header-text">
                        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' }}>
                            {searchParams.get('assetType') ? `${searchParams.get('assetType').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : 'Courses'}
                        </h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                            Manage and monitor all {searchParams.get('assetType') ? searchParams.get('assetType').replace(/_/g, ' ') : 'course'}-to-audience assignments.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/admin/mappings/new')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#2563eb',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: '15px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)'
                        }}
                    >
                        <Plus size={20} />
                        New Course
                    </button>
                </header>

                <div className="filter-section-container" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>
                        <Filter size={16} />
                        Filter By
                    </div>
                    <section className="filter-bar-custom" style={{
                        position: 'relative',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'white',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {!searchParams.get('assetType') && (
                                <div className="combo-select combo-dropdown dropdown-container" ref={assetDropdownRef}>
                                    <span className="combo-label">Asset</span>
                                    <span className="combo-divider"></span>
                                    <div className="combo-trigger" onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}>
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: filters.assetType ? '#1e293b' : '#64748b' }}>
                                            {filters.assetType ? filters.assetType.charAt(0).toUpperCase() + filters.assetType.slice(1) + 's' : 'All Assets'}
                                        </span>
                                        <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                                    </div>
                                    {isAssetDropdownOpen && (
                                        <div className="paged-dropdown-menu custom-combo-menu">
                                            <div className="dropdown-options-list">
                                                {[
                                                    { label: 'All Assets', value: '' },
                                                    { label: 'Courses', value: 'course' },
                                                    { label: 'Workshops', value: 'workshop' },
                                                    { label: 'Books', value: 'book' },
                                                    { label: 'Bytes', value: 'byte' }
                                                ].map(opt => (
                                                    <label key={opt.value} className="menu-item-check">
                                                        <input
                                                            type="radio"
                                                            name="assetTypeFilter"
                                                            checked={filters.assetType === opt.value}
                                                            onChange={() => {
                                                                const val = opt.value;
                                                                setFilters({ ...filters, assetType: val });
                                                                if (val) setSearchParams({ assetType: val });
                                                                else setSearchParams({});
                                                                setIsAssetDropdownOpen(false);
                                                            }}
                                                        />
                                                        <span>{opt.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="combo-select combo-dropdown dropdown-container" ref={userTypeDropdownRef}>
                                <span className="combo-label">User Type</span>
                                <span className="combo-divider"></span>
                                <div className="combo-trigger" onClick={() => setIsUserTypeDropdownOpen(!isUserTypeDropdownOpen)}>
                                    <span style={{ fontSize: '13px', fontWeight: '500', color: filters.userType ? '#1e293b' : '#64748b' }}>
                                        {filters.userType || 'Select'}
                                    </span>
                                    <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                                </div>
                                {isUserTypeDropdownOpen && (
                                    <div className="paged-dropdown-menu custom-combo-menu">
                                        <div className="dropdown-options-list">
                                            {['Premium', 'Ultra', 'School'].map(t => (
                                                <label key={t} className="menu-item-check">
                                                    <input
                                                        type="radio"
                                                        name="userTypeFilter"
                                                        checked={filters.userType === t}
                                                        onChange={() => {
                                                            const shouldShowSchoolDropdown = t.toLowerCase() === 'school';
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                userType: t,
                                                                schoolIds: shouldShowSchoolDropdown ? prev.schoolIds : [],
                                                                gradeIds: !shouldShowSchoolDropdown ? prev.gradeIds : []
                                                            }));
                                                            setIsUserTypeDropdownOpen(false);
                                                            if (!shouldShowSchoolDropdown) setIsSchoolDropdownOpen(false);
                                                            else setIsGradeDropdownOpen(false);
                                                        }}
                                                    />
                                                    <span>{t}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {canShowSchool && (
                                <div className="combo-select combo-dropdown dropdown-container" ref={schoolDropdownRef}>
                                    <span className="combo-label">School</span>
                                    <span className="combo-divider"></span>
                                    <div className="combo-trigger" onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}>
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: filters.schoolIds.length > 0 ? '#1e293b' : '#64748b' }}>
                                            {filters.schoolIds.length === 0 ? 'Select' : (schools.find(s => Number(s.id) === Number(filters.schoolIds[0]))?.name || 'Selected')}
                                        </span>
                                        <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                                    </div>
                                    {isSchoolDropdownOpen && (
                                        <div className="paged-dropdown-menu custom-combo-menu">

                                            <div className="dropdown-options-list">
                                                {schools.map(s => (
                                                    <label key={s.id} className="menu-item-check">
                                                        <input
                                                            type="radio"
                                                            name="schoolFilter"
                                                            checked={filters.schoolIds.map(Number).includes(Number(s.id)) && filters.schoolIds.length === 1}
                                                            onChange={(e) => {
                                                                setFilters({ ...filters, schoolIds: [Number(s.id)] });
                                                                setIsSchoolDropdownOpen(false);
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

                            {canShowGrades && (
                                <div className="combo-select combo-dropdown dropdown-container" ref={gradeDropdownRef}>
                                    <span className="combo-label">Grade</span>
                                    <span className="combo-divider"></span>
                                    <div className="combo-trigger" onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}>
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: filters.gradeIds.length > 0 ? '#1e293b' : '#64748b' }}>
                                            {filters.gradeIds.length === 0 ? 'Select' : (grades.find(g => g.id === filters.gradeIds[0])?.name || 'Selected')}
                                        </span>
                                        <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                                    </div>
                                    {isGradeDropdownOpen && (
                                        <div className="paged-dropdown-menu custom-combo-menu">

                                            <div className="dropdown-options-list">
                                                {grades.map(g => (
                                                    <label key={g.id} className="menu-item-check">
                                                        <input
                                                            type="radio"
                                                            name="gradeFilter"
                                                            checked={filters.gradeIds.includes(g.id) && filters.gradeIds.length === 1}
                                                            onChange={(e) => {
                                                                setFilters({ ...filters, gradeIds: [g.id] });
                                                                setIsGradeDropdownOpen(false);
                                                            }}
                                                        />
                                                        <span>{g.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {canShowCategory && (
                                <div className="combo-select combo-dropdown dropdown-container" ref={categoryDropdownRef}>
                                    <span className="combo-label">Category</span>
                                    <span className="combo-divider"></span>
                                    <div className="combo-trigger" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                                            {filters.category.includes('All') ? 'All' : (filters.category.length === 1 ? filters.category[0] : `${filters.category.length} Selected`)}
                                        </span>
                                        <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                                    </div>
                                    {isCategoryDropdownOpen && (
                                        <div className="paged-dropdown-menu custom-combo-menu">

                                            <div className="dropdown-options-list">
                                                {categories.map(c => (
                                                    <label key={c} className={`menu-item-check ${c === 'All' ? 'all-option' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={filters.category.includes(c)}
                                                            onChange={() => {
                                                                let newSelection;
                                                                if (c === 'All') {
                                                                    newSelection = ['All'];
                                                                } else {
                                                                    // Remove 'All' if it was there
                                                                    const filtered = filters.category.filter(x => x !== 'All');
                                                                    if (filtered.includes(c)) {
                                                                        newSelection = filtered.filter(x => x !== c);
                                                                    } else {
                                                                        newSelection = [...filtered, c];
                                                                    }
                                                                    // If empty, revert to All
                                                                    if (newSelection.length === 0) newSelection = ['All'];
                                                                }
                                                                setFilters({ ...filters, category: newSelection });
                                                            }}
                                                        />
                                                        <span>{c}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                className="btn btn-primary"
                                style={{
                                    padding: '8px 20px', borderRadius: '6px', fontSize: '13.5px', fontWeight: '600', border: 'none',
                                    opacity: isFormComplete ? 1 : 0.4, cursor: isFormComplete ? 'pointer' : 'not-allowed',
                                    background: '#2563eb', color: 'white'
                                }}
                                disabled={!isFormComplete}
                                onClick={handleSubmit}
                            >Submit</button>
                            <button
                                className="btn btn-secondary"
                                style={{
                                    padding: '8px 20px', borderRadius: '6px', fontSize: '13.5px', background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '500',
                                    opacity: isAnyFilterSelected ? 1 : 0.4, cursor: isAnyFilterSelected ? 'pointer' : 'not-allowed'
                                }}
                                disabled={!isAnyFilterSelected}
                                onClick={() => {
                                    setFilters({
                                        search: '',
                                        assetType: searchParams.get('assetType') || '',
                                        category: ['All'],
                                        userType: '',
                                        gradeIds: [],
                                        schoolIds: []
                                    });
                                    setHasSubmitted(false);
                                    setData([]);
                                    const assetType = searchParams.get('assetType');
                                    setSearchParams(assetType ? { assetType } : {});
                                }}
                            >Reset</button>
                        </div>
                    </section>
                </div>

                <div className="search-section-standalone" style={{ marginBottom: '24px' }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative', width: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                        <input
                            type="text"
                            placeholder="Search by course title..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onKeyUp={() => {
                                if (filters.search.length > 2) {
                                    setHasSubmitted(true);
                                    loadData();
                                }
                            }}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                background: '#ffffff',
                                color: '#1e293b',
                                fontSize: '15px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s'
                            }}
                        />
                    </form>
                </div>





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

                <div className="dashboard-main animate-fade-in glass" style={{ position: 'relative', zIndex: 1, animationDelay: '0.2s', padding: '1px', borderRadius: 'var(--radius-lg)' }}>
                    {!hasSubmitted ? (
                        <div className="empty-state" style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>
                            <Layers size={48} style={{ opacity: 0.2, marginBottom: '16px', color: '#64748b' }} />
                            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px', fontWeight: '600' }}>Select Filters to Continue</h3>
                            <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>Please select the user type, school, grades, and category from the top bar to view mapped assets.</p>
                        </div>
                    ) : loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Fetching mappings...</p>
                        </div>
                    ) : (
                        <>
                            <MappingTable
                                mappings={data}
                                assetType={searchParams.get('assetType')}
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

            <AdminDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => {
                    if (!deletingId) {
                        setDeleteModal({ isOpen: false, id: null, title: '' });
                    }
                }}
                onConfirm={confirmDelete}
                itemName={deleteModal.title}
                type={((searchParams.get('assetType') || 'Course').charAt(0).toUpperCase() + (searchParams.get('assetType') || 'Course').slice(1))}
            />

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

        .combo-select {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border-radius: 6px;
          padding: 6px 14px;
          height: 38px;
        }

        .combo-label {
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          white-space: nowrap;
        }

        .combo-divider {
          width: 1px;
          height: 20px;
          background: #cbd5e1;
          margin: 0 12px;
        }

        .combo-input {
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          outline: none;
          cursor: pointer;
          appearance: auto;
          -webkit-appearance: auto;
        }

        .combo-trigger {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .custom-combo-menu {
          top: calc(100% + 8px);
          min-width: 220px;
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
