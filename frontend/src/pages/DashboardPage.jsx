import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Layout from '../components/common/Layout';
import MappingTable from '../components/dashboard/MappingTable';
import { getMappings, deleteMapping } from '../services/api';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [fetchError, setFetchError] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        assetType: searchParams.get('assetType') || '',
        status: ''
    });

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

    const loadData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await getMappings({
                limit,
                offset: (page - 1) * limit,
                search: filters.search || undefined,
                content_type: filters.assetType || undefined,
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
                rows = rows.filter(r => r.content_type === filters.assetType);
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
    }, [page, filters.assetType, filters.status]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this mapping? This action cannot be undone.')) {
            try {
                await deleteMapping(id);
                loadData();
            } catch (err) {
                alert('Failed to delete mapping');
            }
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
                        <h1>Mapped Assets</h1>
                        <p>Manage and monitor all course-to-audience assignments.</p>
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
                        <div className="filter-item glass">
                            <Filter size={16} />
                            <select
                                value={filters.assetType}
                                onChange={handleAssetTypeChange}
                            >
                                <option value="">All Asset Types</option>
                                <option value="course">Courses</option>
                                <option value="workshop">Workshops</option>
                                <option value="book">Books</option>
                                <option value="byte">Bytes</option>
                                <option value="category">Categories</option>
                            </select>
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
          background: white;
          padding: 16px 24px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .search-form {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-form input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md);
          font-size: 14px;
          background: #f8fafc;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          color: #64748b;
        }

        .filter-item select {
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
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
      ` }} />
        </Layout>
    );
};

export default DashboardPage;
