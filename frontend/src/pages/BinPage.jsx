import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { getBin, restoreCourse } from '../services/api';
import { Trash2, RefreshCw, ChevronLeft, ChevronRight, Search, RotateCcw, ShieldAlert, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const BinPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [restoringId, setRestoringId] = useState(null);

    const loadBin = async () => {
        try {
            setLoading(true);
            const res = await getBin();
            setItems(Array.isArray(res) ? res : (res.data || res.items || []));
        } catch (err) {
            console.error("Failed to load bin items", err);
            // toast.error("Failed to load deleted items.");
            // For now, let's just use empty state if endpoint fails
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBin();
    }, []);

    const handleRestore = async (id) => {
        try {
            setRestoringId(id);
            await restoreCourse(id);
            toast.success("Item restored successfully!");
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Restore failed", err);
            toast.error("Failed to restore item.");
        } finally {
            setRestoringId(null);
        }
    };

    const filteredItems = items.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.id).includes(searchTerm)
    );

    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);
    const totalPages = Math.ceil(filteredItems.length / limit) || 1;

    return (
        <Layout title="Bin - Deleted Assets">
            <div className="bin-container">
                <header className="bin-header animate-fade-in">
                    <div className="header-text">
                        <h1>Bin</h1>
                        <p>Items moved here can be restored or will be permanently deleted after 30 days.</p>
                    </div>
                </header>

                <div className="bin-toolbar animate-fade-in">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search in bin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bin-main glass animate-fade-in">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading bin items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="empty-state">
                            <Trash2 size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                            <h3>The bin is empty</h3>
                            <p>Things you delete will appear here for 30 days.</p>
                        </div>
                    ) : (
                        <>
                            <table className="bin-table">
                                <thead>
                                    <tr>
                                        <th>Asset ID</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Deleted On</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map(item => (
                                        <tr key={item.id}>
                                            <td className="id-cell">#{item.id}</td>
                                            <td className="title-cell">
                                                <strong>{item.title || item.name || 'Untitled'}</strong>
                                            </td>
                                            <td>
                                                <span className="type-badge">
                                                    {item.category || item.type || 'Course'}
                                                </span>
                                            </td>
                                            <td className="date-cell">
                                                {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : 'Recently'}
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="restore-btn"
                                                    onClick={() => handleRestore(item.id)}
                                                    disabled={restoringId === item.id}
                                                >
                                                    {restoringId === item.id ? (
                                                        <RefreshCw size={16} className="spinning" />
                                                    ) : (
                                                        <>
                                                            <RotateCcw size={16} />
                                                            <span>Restore</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <footer className="table-footer">
                                <div className="pagination-info">
                                    Showing items {(page - 1) * limit + 1} to {Math.min(page * limit, filteredItems.length)} of {filteredItems.length}
                                </div>
                                <div className="pagination-actions">
                                    <button
                                        className="pagi-btn"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="page-indicator">Page {page} of {totalPages}</span>
                                    <button
                                        className="pagi-btn"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => p + 1)}
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
                .bin-container {
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                }

                .bin-header h1 {
                    font-size: 32px;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .bin-header p {
                    font-size: 15px;
                    color: #64748b;
                    margin: 4px 0 0 0;
                    font-weight: 500;
                }

                .bin-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .search-box {
                    position: relative;
                    width: 320px;
                }

                .search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }

                .search-box input {
                    width: 100%;
                    padding: 12px 14px 12px 42px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }

                .search-box input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }

                .bin-main {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .bin-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .bin-table th {
                    text-align: left;
                    padding: 16px 24px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 0.05em;
                }

                .bin-table td {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 14px;
                    color: #334155;
                }

                .id-cell {
                    color: #94a3b8;
                    font-family: monospace;
                    font-size: 13px!important;
                }

                .title-cell strong {
                    color: #1e293b;
                    font-weight: 600;
                }

                .type-badge {
                    padding: 4px 12px;
                    background: #f1f5f9;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #475569;
                }

                .date-cell {
                    color: #64748b;
                }

                .actions-cell {
                    text-align: right;
                }

                .restore-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #eff6ff;
                    color: #2563eb;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .restore-btn:hover:not(:disabled) {
                    background: #2563eb;
                    color: white;
                }

                .restore-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .table-footer {
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                }

                .pagination-info {
                    font-size: 14px;
                    color: #64748b;
                }

                .pagination-actions {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .page-indicator {
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                }

                .pagi-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .pagi-btn:hover:not(:disabled) {
                    border-color: #2563eb;
                    color: #2563eb;
                }

                .pagi-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .loading-state, .empty-state {
                    padding: 80px 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: #64748b;
                }

                .loading-state .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #2563eb;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }

                .empty-state h3 {
                    margin: 0 0 8px 0;
                    color: #1e293b;
                    font-size: 20px;
                    font-weight: 700;
                }

                .empty-state p {
                    margin: 0;
                    max-width: 300px;
                    line-height: 1.5;
                }
                `
            }} />
        </Layout>
    );
};

export default BinPage;
