import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getCourses, getWorkshops, getCategories, getByteCategories, getBooks } from '../../services/api';

const AssetPicker = ({ type, onSelect, selectedIds = [], selectedFilters, schools = [], grades = [] }) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                let res;
                switch (type) {
                    case 'Courses': res = await getCourses(); break;
                    case 'Workshops': {
                        const raw = await getWorkshops();
                        res = Array.isArray(raw) ? raw : (raw.items || raw.data || []);
                        break;
                    }
                    case 'Categories': {
                        let categoriesData = [];
                        try {
                            const categoriesRes = await getCategories();
                            categoriesData = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.items || categoriesRes.data || []);
                        } catch (_) {
                            categoriesData = [];
                        }

                        if (categoriesData.length > 0) {
                            const uniqueByName = new Map();
                            categoriesData.forEach((cat) => {
                                const label = cat?.name || cat?.title || cat?.category;
                                if (!label) return;
                                if (!uniqueByName.has(label)) {
                                    uniqueByName.set(label, {
                                        id: cat?.id ?? label,
                                        title: label,
                                        category: 'Course Categories',
                                        category_name: label,
                                    });
                                }
                            });
                            res = Array.from(uniqueByName.values());
                        } else {
                            const coursesRes = await getCourses();
                            const coursesData = Array.isArray(coursesRes) ? coursesRes : (coursesRes.data || []);
                            const uniqueCats = [...new Set(coursesData.map(c => c.category).filter(Boolean))];
                            res = uniqueCats.map(cat => ({ id: cat, title: cat, category: 'Course Categories', category_name: cat }));
                        }
                        break;
                    }
                    case 'Bytes': res = await getByteCategories(); break;
                    case 'Books': res = await getBooks(); break;
                    default: res = [];
                }
                const data = Array.isArray(res) ? res : (res.items || res.data || []);
                setAssets(data);
            } catch (err) {
                console.error('Failed to fetch assets', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, [type]);

    // Filter by search & by selected categories for Courses
    const filteredAssets = assets.filter(a => {
        const label = (a.title || a.name || '').toLowerCase();
        const matchesSearch = label.includes(search.toLowerCase());
        if (type === 'Courses') {
            const selectedCategories = selectedFilters?.selectedAssets
                ?.filter(asset => asset.type === 'Categories')
                ?.map(asset => asset.category_name || asset.title || asset.name)
                ?.filter(Boolean) || [];
            if (selectedCategories.length > 0) {
                return matchesSearch && selectedCategories.includes(a.category);
            }
        }
        return matchesSearch;
    });

    // For Workshops: show a flat list — no category grouping headers
    // For other types (Categories, Courses): group by category/status
    const FLAT_TYPES = ['Workshops', 'Books', 'Bytes'];

    const groupedAssets = FLAT_TYPES.includes(type)
        ? { [type]: filteredAssets }            // single flat group
        : filteredAssets.reduce((acc, asset) => {
            let key;
            if (asset.status) {
                key = `${type} ${asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}`;
            } else if (asset.category && asset.category !== type) {
                key = asset.category;
            } else {
                key = type;
            }
            if (!acc[key]) acc[key] = [];
            acc[key].push(asset);
            return acc;
        }, {});

    // Human-readable labels for the read-only filter dropdowns
    const userTypeLabel = {
        all: 'All User Types',
        Premium: 'Premium',
        Ultra: 'Ultra',
        School: 'Schools',
    }[selectedFilters?.userType] || selectedFilters?.userType || '—';

    const mappingTypeLabel = selectedFilters?.assignmentMode || '—';

    const gradeLabel = (() => {
        const ids = selectedFilters?.gradeIds || [];
        if (ids.length === 0) return '—';
        if (ids.length === grades.length && grades.length > 0) return 'All Grades';
        if (ids.length === 1) {
            const g = grades.find(g => g.id === ids[0]);
            return g?.grade_name || g?.name || `Grade ${ids[0]}`;
        }
        return `${ids.length} Grade(s)`;
    })();

    const groupKeys = Object.keys(groupedAssets);

    return (
        <div className="wm-wrapper">

            {/* ── Filter Row ─────────────────────────────────── */}
            <div className="wm-filters">
                <div className="wm-filter-col">
                    <span className="wm-filter-label">Mapping Type</span>
                    <div className="wm-filter-box">
                        <span className="wm-filter-value">{mappingTypeLabel}</span>
                        <span className="wm-chevron">⌄</span>
                    </div>
                </div>

                <div className="wm-filter-col">
                    <span className="wm-filter-label">Select User Group</span>
                    <div className="wm-filter-box">
                        <span className="wm-filter-value">{userTypeLabel}</span>
                        <span className="wm-chevron">⌄</span>
                    </div>
                </div>

                {(selectedFilters?.userType === 'School') && (
                    <div className="wm-filter-col">
                        <span className="wm-filter-label">Select Schools</span>
                        <div className="wm-filter-box">
                            <span className="wm-filter-value">
                                {!selectedFilters.schoolIds?.length
                                    ? '—'
                                    : selectedFilters.schoolIds.length === schools.length && schools.length > 0
                                        ? 'All Schools'
                                        : `${selectedFilters.schoolIds.length} School(s)`}
                            </span>
                            <span className="wm-chevron">⌄</span>
                        </div>
                    </div>
                )}

                <div className="wm-filter-col">
                    <span className="wm-filter-label">Select Grades</span>
                    <div className="wm-filter-box">
                        <span className="wm-filter-value">{gradeLabel}</span>
                        <span className="wm-chevron">⌄</span>
                    </div>
                </div>
            </div>

            {/* ── Search ─────────────────────────────────────── */}
            <div className="wm-search">
                <Search size={16} className="wm-search-icon" />
                <input
                    type="text"
                    placeholder={`Search ${type.toLowerCase()}...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* ── Asset List Card ─────────────────────────────── */}
            <div className="wm-card">
                {loading ? (
                    <div className="wm-state">
                        <Loader2 size={26} className="wm-spin" />
                        <span>Loading {type}...</span>
                    </div>
                ) : filteredAssets.length === 0 ? (
                    <div className="wm-state">
                        <Search size={28} opacity={0.25} />
                        <span>No {type.toLowerCase()} found{search ? ' matching your search' : ''}.</span>
                    </div>
                ) : (
                    <div className={`wm-groups ${type === 'Courses' ? 'wm-groups-courses' : ''}`}>
                        {groupKeys.map(groupName => (
                            <div key={groupName} className="wm-group">
                                {(type === 'Courses' || groupKeys.length > 1) && (
                                    <p className="wm-group-title">{groupName}</p>
                                )}
                                <div className="wm-items">
                                    {groupedAssets[groupName].map(asset => {
                                        const isSelected = selectedIds.includes(asset.id);
                                        return (
                                            <label
                                                key={asset.id}
                                                className={`wm-item ${isSelected ? 'wm-item--on' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onSelect({ ...asset, type })}
                                                    className="wm-cb"
                                                />
                                                <span className="wm-item-label">{asset.title || asset.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                /* ── Wrapper ─────────────────────────── */
                .wm-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .wm-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                    letter-spacing: -0.3px;
                }

                /* ── Filters ─────────────────────────── */
                .wm-filters {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .wm-filter-col {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    flex: 1;
                    min-width: 130px;
                }

                .wm-filter-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                .wm-filter-box {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f9fafb;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 9px 14px;
                    cursor: default;
                    min-height: 40px;
                }

                .wm-filter-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .wm-chevron {
                    font-size: 14px;
                    color: #9ca3af;
                    margin-left: 6px;
                    flex-shrink: 0;
                }

                /* ── Search ──────────────────────────── */
                .wm-search {
                    position: relative;
                }

                .wm-search-icon {
                    position: absolute;
                    left: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    pointer-events: none;
                }

                .wm-search input {
                    width: 100%;
                    height: 40px;
                    padding: 0 16px 0 40px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #111827;
                    background: #fff;
                    outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    box-sizing: border-box;
                }

                .wm-search input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
                }

                .wm-search input::placeholder {
                    color: #9ca3af;
                }

                /* ── Asset Card ──────────────────────── */
                .wm-card {
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 18px 20px;
                    min-height: 180px;
                    max-height: 340px;
                    overflow-y: auto;
                    background: #fff;
                    scrollbar-width: thin;
                    scrollbar-color: #e5e7eb transparent;
                }

                .wm-card::-webkit-scrollbar {
                    width: 5px;
                }
                .wm-card::-webkit-scrollbar-track { background: transparent; }
                .wm-card::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }

                /* ── Group ───────────────────────────── */
                .wm-group {
                    margin-bottom: 20px;
                }
                .wm-group:last-child {
                    margin-bottom: 0;
                }

                .wm-groups {
                    display: block;
                }

                .wm-groups-courses {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 14px;
                    align-items: start;
                }

                .wm-groups-courses .wm-group {
                    margin-bottom: 0;
                    border: 1px solid #eef2f7;
                    border-radius: 8px;
                    padding: 10px 12px;
                    background: #ffffff;
                }

                .wm-group-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 10px 0;
                    padding-bottom: 7px;
                    border-bottom: 1.5px solid #f3f4f6;
                }

                /* ── Items ───────────────────────────── */
                .wm-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-left: 2px;
                }

                .wm-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    padding: 3px 0;
                    user-select: none;
                }

                /* Native checkbox styled like reference — blue when checked */
                .wm-cb {
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid #d1d5db;
                    border-radius: 3px;
                    cursor: pointer;
                    accent-color: #2563eb;
                    flex-shrink: 0;
                    margin: 0;
                }

                .wm-item-label {
                    font-size: 14px;
                    color: #374151;
                    line-height: 1.4;
                    transition: color 0.1s;
                }

                .wm-item--on .wm-item-label {
                    color: #6b7280;
                }

                .wm-item:hover .wm-item-label {
                    color: #111827;
                }

                /* ── State (loading / empty) ─────────── */
                .wm-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 48px 24px;
                    color: #9ca3af;
                    font-size: 14px;
                    text-align: center;
                }

                .wm-spin {
                    animation: wm-rotate 1s linear infinite;
                }

                @keyframes wm-rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default AssetPicker;
