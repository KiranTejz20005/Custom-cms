import React, { useState, useEffect } from 'react';
import { Search, X, Check, BookOpen, Video, Briefcase, Hash, List } from 'lucide-react';
import { getCourses, getWorkshops, getBooks, getByteCategories, getCategories } from '../../services/api';

const AssetSelection = ({ data, updateData }) => {
    const [activeTab, setActiveTab] = useState('Courses');
    const [assets, setAssets] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const tabs = [
        { name: 'Courses', icon: Video, color: '#6366f1' },
        { name: 'Workshops', icon: Briefcase, color: '#f59e0b' },
        { name: 'Books', icon: BookOpen, color: '#10b981' },
        { name: 'Bytes', icon: Hash, color: '#ec4899' },
        { name: 'Categories', icon: List, color: '#8b5cf6' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let res;
                switch (activeTab) {
                    case 'Courses': res = await getCourses(); break;
                    case 'Workshops': res = await getWorkshops(); break;
                    case 'Books': res = await getBooks(); break;
                    case 'Bytes': res = await getByteCategories(); break;
                    case 'Categories': res = await getCategories(); break;
                    default: res = { data: [] };
                }
                setAssets(Array.isArray(res) ? res : (res.data || res.items || []));
            } catch (err) {
                console.error("Failed to fetch assets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const filteredAssets = assets.filter(asset =>
        (asset.title || asset.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const toggleAsset = (asset) => {
        const isSelected = data.selectedAssets.some(a => a.id === asset.id && a.type === activeTab);
        if (isSelected) {
            updateData({
                selectedAssets: data.selectedAssets.filter(a => !(a.id === asset.id && a.type === activeTab))
            });
        } else {
            updateData({
                selectedAssets: [...data.selectedAssets, { ...asset, type: activeTab }]
            });
        }
    };

    return (
        <div className="step-content">
            <div className="tabs-container">
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        className={`asset-tab ${activeTab === tab.name ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.name)}
                        style={{ '--accent': tab.color }}
                    >
                        <tab.icon size={18} />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            <div className="asset-selection-grid">
                <div className="available-assets">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="assets-list">
                        {loading ? (
                            <div className="loading-placeholder">Loading assets...</div>
                        ) : filteredAssets.length > 0 ? (
                            filteredAssets.map(asset => {
                                const isSelected = data.selectedAssets.some(a => a.id === asset.id && a.type === activeTab);
                                return (
                                    <label key={asset.id} className={`asset-item ${isSelected ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleAsset(asset)}
                                        />
                                        <div className="checkbox-ui">
                                            {isSelected && <Check size={14} />}
                                        </div>
                                        <span className="asset-name">{asset.title || asset.name}</span>
                                        {asset.category && <span className="asset-tag">{asset.category}</span>}
                                    </label>
                                );
                            })
                        ) : (
                            <div className="no-results">No {activeTab.toLowerCase()} found.</div>
                        )}
                    </div>
                </div>

                <div className="selected-assets-panel">
                    <div className="panel-header">
                        <h3>Selected Items ({data.selectedAssets.length})</h3>
                        {data.selectedAssets.length > 0 && (
                            <button className="clear-all" onClick={() => updateData({ selectedAssets: [] })}>
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="selected-chips">
                        {data.selectedAssets.length > 0 ? (
                            data.selectedAssets.map(asset => (
                                <div key={`${asset.type}-${asset.id}`} className="asset-chip">
                                    <span className="chip-type">{asset.type}</span>
                                    <span className="chip-name">{asset.title || asset.name}</span>
                                    <button
                                        className="remove-chip"
                                        onClick={() => updateData({
                                            selectedAssets: data.selectedAssets.filter(a => !(a.id === asset.id && a.type === asset.type))
                                        })}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-selection">
                                <Info size={16} />
                                <span>No items selected yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .tabs-container {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 24px;
        }

        .asset-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 14px;
        }

        .asset-tab:hover {
          background: #f1f5f9;
          color: var(--text-main);
        }

        .asset-tab.active {
          background: var(--accent);
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .asset-selection-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          min-height: 400px;
        }

        .available-assets {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .search-box {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 14px;
        }

        .assets-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .asset-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
        }

        .asset-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .asset-item.selected {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .asset-item input {
          display: none;
        }

        .checkbox-ui {
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .asset-item.selected .checkbox-ui {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .asset-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
        }

        .asset-tag {
          font-size: 12px;
          padding: 2px 8px;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 100px;
        }

        .selected-assets-panel {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .panel-header h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .clear-all {
          background: transparent;
          color: var(--danger);
          font-size: 13px;
          font-weight: 600;
        }

        .selected-chips {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
        }

        .asset-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .chip-type {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          background: #eef2ff;
          color: var(--primary);
          border-radius: 4px;
        }

        .chip-name {
          flex: 1;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .remove-chip {
          background: transparent;
          color: var(--text-muted);
          padding: 4px;
        }

        .remove-chip:hover {
          color: var(--danger);
        }

        .empty-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: var(--text-muted);
          gap: 12px;
          font-size: 14px;
        }

        .loading-placeholder, .no-results {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
      ` }} />
        </div>
    );
};

export default AssetSelection;
