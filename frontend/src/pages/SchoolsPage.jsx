import React, { useState, useEffect } from 'react';
import { Search, School, Layers, Loader2, Info } from 'lucide-react';
import Layout from '../components/common/Layout';
import { getSchools } from '../services/api';

const SchoolsPage = () => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchSchools = async () => {
            setLoading(true);
            try {
                const res = await getSchools();
                // Adjust for potential array vs data.data response structure
                const data = Array.isArray(res) ? res : (res.data || []);
                setSchools(data);
            } catch (err) {
                console.error("Failed to fetch schools:", err);
                setError("Error loading schools. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchSchools();
    }, []);

    const handleSearchChange = (e) => setSearch(e.target.value);

    const filteredSchools = schools.filter(school =>
        (school.name || school.school_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (school.id || '').toString().includes(search)
    );

    return (
        <Layout title="School Management">
            <div className="schools-page-header">
                <div className="search-container glass-light">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by school name or ID..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className="school-table-container glass">
                {loading ? (
                    <div className="empty-state">
                        <Loader2 className="animate-spin" size={32} />
                        <span>Retrieving schools from Xano...</span>
                    </div>
                ) : error ? (
                    <div className="empty-state error">
                        <span>{error}</span>
                    </div>
                ) : filteredSchools.length === 0 ? (
                    <div className="empty-state">
                        <span>No schools found matching your search.</span>
                    </div>
                ) : (
                    <table className="school-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>School name</th>
                                <th>Subscription Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchools.map(school => (
                                <tr key={school.id}>
                                    <td className="id-col">#{school.id}</td>
                                    <td className="name-col">{school.school_name || school.name || 'No Name'}</td>
                                    <td className="sub-type-col">
                                        <div className="sub-badge">
                                            <Layers size={14} />
                                            <span>{school.subscription_type || 'Basic'}</span>
                                        </div>
                                    </td>
                                    <td className="status-col">
                                        <span className={`status-pill ${school.is_active !== false ? 'active' : 'inactive'}`}>
                                            {school.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .schools-page-header {
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

        .school-table-container {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: white;
          border: 1px solid var(--border-color);
        }

        .school-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .school-table th {
          background: #f8fafc;
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          border-bottom: 1px solid var(--border-color);
        }

        .school-table td {
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

        .sub-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #eef2ff;
          color: var(--primary);
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-pill.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-pill.inactive {
          background: #fee2e2;
          color: #991b1b;
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
      ` }} />
        </Layout>
    );
};

export default SchoolsPage;
