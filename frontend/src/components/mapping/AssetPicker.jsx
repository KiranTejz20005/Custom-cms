import React, { useState, useEffect } from 'react';
import { Search, Loader2, Check } from 'lucide-react';
import { getCourses, getWorkshops, getCategories, getByteCategories, getBooks } from '../../services/api';

const AssetPicker = ({ type, onSelect, selectedIds = [], selectedFilters, onFilterChange, schools = [], grades = [] }) => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [groupedAssets, setGroupedAssets] = useState({});

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                let res;
                switch (type) {
                    case 'Courses': res = await getCourses(); break;
                    case 'Workshops':
                        const workshopsRes = await getWorkshops();
                        res = Array.isArray(workshopsRes) ? workshopsRes : (workshopsRes.items || workshopsRes.data || []);
                        break;
                    case 'Categories':
                        const coursesRes = await getCourses();
                        const coursesData = Array.isArray(coursesRes) ? coursesRes : (coursesRes.data || []);
                        const uniqueCats = [...new Set(coursesData.map(c => c.category).filter(Boolean))];
                        res = uniqueCats.map(cat => ({
                            id: cat,
                            title: cat,
                            category: 'Course Categories'
                        }));
                        break;
                    case 'Bytes': res = await getByteCategories(); break;
                    case 'Books': res = await getBooks(); break;
                    default: res = [];
                }

                const data = Array.isArray(res) ? res : (res.items || res.data || []);
                setAssets(data);

                // Group by category if course
                const groups = data.reduce((acc, asset) => {
                    const cat = asset.category || 'General';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(asset);
                    return acc;
                }, {});
                setGroupedAssets(groups);
            } catch (err) {
                console.error("Failed to fetch assets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, [type]);

    const filteredGroups = Object.keys(groupedAssets).reduce((acc, cat) => {
        let matching = groupedAssets[cat].filter(a =>
            (a.title || a.name || '').toLowerCase().includes(search.toLowerCase())
        );

        // EXTRA FILTER: If picking courses, only show those whose category is selected in the 'Categories' section
        if (type === 'Courses') {
            const selectedCategories = selectedFilters?.selectedAssets
                ?.filter(asset => asset.type === 'Categories')
                ?.map(asset => asset.id) || [];

            if (selectedCategories.length > 0) {
                matching = matching.filter(course => selectedCategories.includes(course.category));
            }
        }

        if (matching.length > 0) acc[cat] = matching;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="picker-loading">
                <Loader2 size={32} className="spinning" />
                <p>Loading {type}...</p>
            </div>
        );
    }

    return (
        <div className="asset-picker">
            <div className="picker-container glass-light">
                <div className="picker-filters">
                    <div className="filter-field readonly">
                        <label>Mapping Type</label>
                        <select value={selectedFilters?.assignmentMode || ''} disabled>
                            <option value="">Select</option>
                            <option value="User">User</option>
                            <option value="Asset">Asset</option>
                        </select>
                    </div>

                    <div className="filter-field readonly">
                        <label>User Type</label>
                        <select value={selectedFilters?.userType || ''} disabled>
                            <option value="">Select</option>
                            <option value="all">All User Type</option>
                            <option value="Premium">Premium Type</option>
                            <option value="Ultra">Ultra Type</option>
                            <option value="School">Schools Type</option>
                        </select>
                    </div>

                    {(selectedFilters?.assignmentMode === 'School' || selectedFilters?.userType === 'School') && (
                        <div className="filter-field readonly">
                            <label>Selected Schools</label>
                            <div className="readonly-text">
                                {selectedFilters.schoolIds?.length === 0
                                    ? 'None'
                                    : selectedFilters.schoolIds?.length === schools.length && schools.length > 0
                                        ? 'All Schools'
                                        : `${selectedFilters.schoolIds?.length} School(s) selected`}
                            </div>
                        </div>
                    )}

                    <div className="filter-field readonly">
                        <label>Selected Grades</label>
                        <div className="readonly-text">
                            {selectedFilters.gradeIds?.length === 0
                                ? 'None'
                                : selectedFilters.gradeIds?.length === grades.length && grades.length > 0
                                    ? 'All Grades'
                                    : `${selectedFilters.gradeIds?.length} Grade(s) selected`}
                        </div>
                    </div>
                </div>

                <div className="picker-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={`Search ${type.toLowerCase()}...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="picker-grid">
                    {Object.keys(filteredGroups).length > 0 ? (
                        Object.keys(filteredGroups).map(cat => (
                            <div key={cat} className="picker-column">
                                <h4 className="column-title">{cat}</h4>
                                <div className="column-items">
                                    {filteredGroups[cat].map(asset => {
                                        const isSelected = selectedIds.includes(asset.id);
                                        return (
                                            <label key={asset.id} className={`picker-item ${isSelected ? 'selected' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onSelect({ ...asset, type })}
                                                />
                                                <div className="checkbox-ui">
                                                    {isSelected && <Check size={12} />}
                                                </div>
                                                <span>{asset.title || asset.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="picker-empty">No assets found matching the search.</div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .asset-picker {
                    display: flex;
                    flex-direction: column;
                }

                .picker-container {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .picker-filters {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid #f1f5f9;
                    margin-bottom: 20px;
                }

                .filter-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .filter-field label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .filter-field select {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #f8fafc;
                    color: #1e293b;
                    cursor: pointer;
                    outline: none;
                }

                .filter-field select:disabled {
                    background: #f1f5f9;
                    cursor: not-allowed;
                    color: #64748b;
                    border-color: #e2e8f0;
                }

                .readonly-text {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    background: #f1f5f9;
                    color: #64748b;
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                }

                .filter-field select:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
                }

                .picker-search {
                    position: relative;
                    margin-bottom: 20px;
                }

                .picker-search svg {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }

                .picker-search input {
                    width: 100%;
                    padding: 10px 14px 10px 42px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    outline: none;
                }

                .picker-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 32px;
                    max-height: 450px;
                    overflow-y: auto;
                    padding: 4px;
                }

                .column-title {
                    font-size: 14px;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 16px;
                    padding-bottom: 6px;
                    border-bottom: 2px solid #6366f1;
                }

                .column-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .picker-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #4b5563;
                    transition: all 0.2s;
                    line-height: 1.4;
                }

                .picker-item:hover {
                    color: #6366f1;
                }

                .picker-item input {
                    display: none;
                }

                .checkbox-ui {
                    flex-shrink: 0;
                    width: 18px;
                    height: 18px;
                    border: 2px solid #cbd5e1;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    margin-top: 1px;
                }

                .picker-item.selected {
                    color: #6366f1;
                    font-weight: 600;
                }

                .picker-item.selected .checkbox-ui {
                    background: #6366f1;
                    border-color: #6366f1;
                    color: white;
                }

                .picker-loading, .picker-empty {
                    padding: 80px;
                    text-align: center;
                    color: #94a3b8;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default AssetPicker;
