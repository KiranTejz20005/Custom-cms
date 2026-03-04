import React, { useState, useEffect } from 'react';
import { Search, School, Layers, Loader2, Info, MapPin, Globe, Calendar, RefreshCw, Filter } from 'lucide-react';
import Layout from '../components/common/Layout';
import { getSchools } from '../services/api';

const SchoolsPage = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        const res = await getSchools();
        const data = Array.isArray(res) ? res : (res.data || []);
        setSchools(data);

        // Extract unique cities for filter (since Xano has city, not country)
        const uniqueCities = [...new Set(data.map(s => s.city).filter(Boolean))];
        setCountries(uniqueCities); // Reuse existing state name for cities
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

  const filteredSchools = schools.filter(school => {
    const matchesSearch = (school.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (school.id || '').toString().includes(search) ||
      (school.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (school.location || '').toLowerCase().includes(search.toLowerCase());

    const matchesCity = !selectedCountry || school.city === selectedCountry;

    return matchesSearch && matchesCity;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Layout title="School Management">
      <div className="schools-page-header glass animate-fade-in">
        <div className="filter-bar">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, ID, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <MapPin size={16} />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="">All Cities</option>
                {countries.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <button className="icon-btn refresh" onClick={() => window.location.reload()} title="Refresh data">
              <RefreshCw size={18} />
            </button>
          </div>
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
                <th>City</th>
                <th>Location (Area)</th>
                <th>Address</th>
                <th>Created Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map(school => (
                <tr key={school.id}>
                  <td className="id-col">#{school.id}</td>
                  <td className="name-col">{school.name || 'No Name'}</td>
                  <td className="city-col">
                    <span className="city-text">{school.city || '—'}</span>
                  </td>
                  <td className="location-col">
                    <span className="location-text">{school.location || '—'}</span>
                  </td>
                  <td className="address-col">
                    <div className="address-lines">
                      <div className="addr-1">{school.address || '—'}</div>
                    </div>
                  </td>
                  <td className="date-col">
                    <div className="date-info">
                      <Calendar size={14} />
                      <span>{formatDate(school.created_at)}</span>
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
          margin-bottom: 24px;
          border-radius: var(--radius-lg);
          padding: 1px;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          gap: 16px;
          min-height: 64px;
        }

        .search-container {
          position: relative;
          max-width: 400px;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-container input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: white;
          font-size: 14px;
          height: 40px;
          outline: none;
          transition: all 0.2s;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid var(--border-color);
          padding: 0 12px;
          border-radius: 8px;
          height: 40px;
          color: #64748b;
        }

        .filter-item select {
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
        }

        .icon-btn.refresh {
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
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

        .location-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .city {
          font-weight: 600;
        }

        .country-tag {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .address-lines {
          max-width: 300px;
          line-height: 1.4;
        }

        .addr-2 {
          font-size: 12px;
          color: #94a3b8;
        }

        .date-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
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
