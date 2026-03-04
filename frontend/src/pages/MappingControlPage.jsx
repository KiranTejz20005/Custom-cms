import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Plus, Users, Layers, Info } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import AssetPicker from '../components/mapping/AssetPicker';
import { createMapping, getMappingById, updateMapping, getSchools, getGrades, getUserCount } from '../services/api';

const MappingControlPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [countingUsers, setCountingUsers] = useState(false);
  const [schools, setSchools] = useState([]);
  const [grades, setGrades] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    courses: true,
    workshops: true
  });

  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const gradeDropdownRef = useRef(null);

  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target)) {
        setIsGradeDropdownOpen(false);
      }
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target)) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    userType: '',
    gradeIds: [],
    schoolIds: [],
    affectedUsersCount: 0,
    selectedAssets: [],
    accessType: 'immediate',
    startDate: null,
    expiryDate: null,
    assignmentMode: '',
    notes: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Fetching schools and grades...");
        const [schoolsRes, gradesRes] = await Promise.all([
          getSchools(),
          getGrades()
        ]);
        console.log("Schools Raw:", schoolsRes);
        console.log("Grades Raw:", gradesRes);

        const schoolData = Array.isArray(schoolsRes) ? schoolsRes : (schoolsRes.data || []);
        const gradeData = Array.isArray(gradesRes) ? gradesRes : (gradesRes.data || []);

        const sortedGrades = [...gradeData].sort((a, b) => {
          const numA = parseInt(a.name?.replace(/\D/g, '') || a.id);
          const numB = parseInt(b.name?.replace(/\D/g, '') || b.id);
          return numA - numB;
        });

        setSchools(schoolData);
        setGrades(sortedGrades);
      } catch (err) {
        console.error("Failed to fetch prerequisite data", err);
        setError("Failed to load schools or grades from Xano.");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const updateCount = async () => {
      if (!formData.userType) return;
      setCountingUsers(true);
      try {
        const userGroup = formData.userType.toLowerCase() === 'school' ? 'premium' : formData.userType.toLowerCase();
        const params = {
          subscription_type: userGroup,
          grade_id: formData.gradeIds?.[0] || null
        };

        if (formData.schoolIds && formData.schoolIds.length > 0) {
          params.school_id = formData.schoolIds.join(',');
        }

        const res = await getUserCount(params);

        const count = typeof res === 'number' ? res : (res.count || res.affected_users || (Array.isArray(res) ? res.length : (res.items ? res.items.length : 0)));
        setFormData(prev => ({ ...prev, affectedUsersCount: count }));
      } catch (err) {
        console.error("Failed to fetch user count", err);
      } finally {
        setCountingUsers(false);
      }
    };
    updateCount();
  }, [formData.userType, formData.gradeIds, formData.schoolIds]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      const loadMapping = async () => {
        try {
          const res = await getMappingById(id);
          if (!res) throw new Error("No data received");
          const m = res;
          setFormData({
            userType: m.subscription_type ? m.subscription_type.charAt(0).toUpperCase() + m.subscription_type.slice(1) : '',
            gradeIds: m.grade_ids || [],
            schoolId: m.school_id || 0,
            affectedUsersCount: m.user_count || 0,
            selectedAssets: [{ id: m.content_id, title: m.content_title, type: m.content_type?.charAt(0).toUpperCase() + m.content_type?.slice(1) || 'Courses' }],
            accessType: m.starts_at ? 'scheduled' : (m.expires_at ? 'temporary' : 'immediate'),
            startDate: m.starts_at ? m.starts_at.split('T')[0] : null,
            expiryDate: m.expires_at ? m.expires_at.split('T')[0] : null,
            assignmentMode: 'add',
            notes: m.notes || ''
          });
        } catch (err) {
          console.error("Failed to load mapping", err);
          setError("Failed to load mapping data.");
        }
      };
      loadMapping();
    }
  }, [mode, id]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAssetToggle = (asset) => {
    setFormData(prev => {
      const isSelected = prev.selectedAssets.some(a => a.id === asset.id && a.type === asset.type);
      if (isSelected) {
        return {
          ...prev,
          selectedAssets: prev.selectedAssets.filter(a => !(a.id === asset.id && a.type === asset.type))
        };
      }
      return {
        ...prev,
        selectedAssets: [...prev.selectedAssets, asset]
      };
    });
  };

  const openPicker = (type) => {
    // MANDATORY CHECK
    if (!formData.assignmentMode) {
      setError("Please select a Mapping Type first.");
      return;
    }
    if ((formData.userType === 'School' || formData.assignmentMode === 'School') && (!formData.schoolIds || formData.schoolIds.length === 0)) {
      setError("Please select at least one School first.");
      return;
    }
    if (!formData.gradeIds || formData.gradeIds.length === 0) {
      setError("Please select at least one Grade first.");
      return;
    }

    setPickerType(type);
    setShowPicker(true);
  };

  const handleFilterChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (formData.selectedAssets.length === 0) {
      setError("Please add at least one asset to map.");
      return;
    }
    if (!formData.assignmentMode) {
      setError("Please select a Mapping Type.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const typeMap = {
      'Courses': 'course',
      'Workshops': 'workshop',
      'Books': 'book',
      'Bytes': 'byte',
      'Categories': 'category'
    };

    // Build one payload per asset, exactly matching the entitlement table
    const buildPayload = (asset) => {
      const contentType = typeMap[asset.type] || (asset.type || '').toLowerCase();
      // subscription_type from Select User Group (userType), not Mapping Type
      const rawUserType = (formData.userType || '').toLowerCase();
      const isAllUserGroups = rawUserType === 'all' || formData.userType === 'All User Groups';
      const subscriptionType = isAllUserGroups
        ? undefined
        : (rawUserType === 'school' || formData.userType === 'Select School' ? 'premium' : rawUserType);

      const payload = {
        content_type: contentType,
        content_id: asset.id,
        content_title: asset.title || asset.name || '',
        grade_ids: formData.gradeIds && formData.gradeIds.length > 0 ? formData.gradeIds : [],
        is_active: true,
        assigned_by: 1,
      };
      if (subscriptionType != null && subscriptionType !== '') {
        payload.subscription_type = subscriptionType;
      }
      return payload;
    };

    try {
      const allPayloads = [];
      formData.selectedAssets.forEach(asset => {
        const basePayload = buildPayload(asset);
        if ((formData.assignmentMode === 'School' || formData.userType === 'School') && formData.schoolIds && formData.schoolIds.length > 0) {
          formData.schoolIds.forEach(schoolId => {
            allPayloads.push({ ...basePayload, school_id: schoolId });
          });
        } else {
          allPayloads.push({ ...basePayload, school_id: 0 });
        }
      });

      const results = await Promise.allSettled(
        allPayloads.map(payload => createMapping(payload))
      );

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const reasons = failed.map(f => f.reason?.message || 'Unknown error').join('; ');
        setError(`${failed.length} asset(s) failed to save: ${reasons}`);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/admin/mappings/view'), 2000);
    } catch (err) {
      setError(`Failed to save mappings: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Layout title="Status">
        <div className="status-container">
          <div className="success-badge">✓</div>
          <h2>Mapping Applied!</h2>
          <p>Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mapping Control Center">
      <div className="mapping-page">
        {error && (
          <div className="error-toast animate-slide-in">
            <Info size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <header className="mapping-header">
          <h1>Mapping</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/admin/mappings/view')}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Applying...' : 'Apply Mappings'}
            </button>
          </div>
        </header>

        <div className="mapping-grid">
          <section className="config-card glass">
            <div className="filter-group">
              <label>Mapping Type</label>
              <div className="custom-select">
                <select value={formData.assignmentMode} onChange={(e) => setFormData({ ...formData, assignmentMode: e.target.value })}>
                  <option value="" disabled hidden>Select</option>
                  <option value="User">User</option>
                  <option value="Asset">Asset</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="filter-group">
              <label>User Type</label>
              <div className="custom-select">
                <select value={formData.userType} onChange={(e) => setFormData({ ...formData, userType: e.target.value })}>
                  <option value="" disabled hidden>Select</option>
                  <option value="all">All User Type</option>
                  <option value="Premium">Premium Type</option>
                  <option value="Ultra">Ultra Type</option>
                  <option value="School">Schools Type</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            {(formData.assignmentMode === 'School' || formData.userType === 'School') && (
              <div className="filter-group" ref={schoolDropdownRef}>
                <label>Select Schools</label>
                <div
                  className={`custom-select \${isSchoolDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                  style={{ cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#f8fafc', width: '100%' }}
                >
                  <div style={{ padding: '12px 16px', width: '100%', fontSize: '15px' }}>
                    {formData.schoolIds?.length === 0
                      ? 'Choose School...'
                      : formData.schoolIds?.length === schools.length && schools.length > 0
                        ? 'All Schools'
                        : `\${formData.schoolIds?.length} School(s) Selected`}
                  </div>
                  <ChevronDown size={16} style={{
                    position: 'absolute', right: '16px',
                    transform: isSchoolDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    pointerEvents: 'none'
                  }} />
                </div>

                {isSchoolDropdownOpen && (
                  <div className="custom-dropdown-menu animate-slide-in">
                    <label className="dropdown-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.schoolIds?.length === schools.length && schools.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, schoolIds: schools.map(s => s.id) });
                          } else {
                            setFormData({ ...formData, schoolIds: [] });
                          }
                        }}
                      />
                      <span>Select All</span>
                    </label>

                    {schools.map(school => (
                      <label key={school.id} className="dropdown-checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.schoolIds?.includes(school.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData(prev => {
                              const newSchools = isChecked
                                ? [...(prev.schoolIds || []), school.id]
                                : (prev.schoolIds || []).filter(id => id !== school.id);
                              return { ...prev, schoolIds: newSchools };
                            });
                          }}
                        />
                        <span>{school.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="filter-group" ref={gradeDropdownRef}>
              <label>Select Grades</label>
              <div
                className={`custom-select ${isGradeDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                style={{ cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#f8fafc', width: '100%' }}
              >
                <div style={{ padding: '12px 16px', width: '100%', fontSize: '15px' }}>
                  {formData.gradeIds.length === 0
                    ? 'Choose Grade...'
                    : formData.gradeIds.length === grades.length && grades.length > 0
                      ? 'All Grades'
                      : `${formData.gradeIds.length} Grade(s) Selected`}
                </div>
                <ChevronDown size={16} style={{
                  position: 'absolute', right: '16px',
                  transform: isGradeDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                  pointerEvents: 'none'
                }} />
              </div>

              {isGradeDropdownOpen && (
                <div className="custom-dropdown-menu animate-slide-in">
                  <label className="dropdown-checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.gradeIds.length === grades.length && grades.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, gradeIds: grades.map(g => g.id) });
                        } else {
                          setFormData({ ...formData, gradeIds: [] });
                        }
                      }}
                    />
                    <span>Select All</span>
                  </label>

                  {grades.map(grade => (
                    <label key={grade.id} className="dropdown-checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.gradeIds.includes(grade.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFormData(prev => {
                            const newGrades = isChecked
                              ? [...prev.gradeIds, grade.id]
                              : prev.gradeIds.filter(id => id !== grade.id);
                            return { ...prev, gradeIds: newGrades };
                          });
                        }}
                      />
                      <span>{grade.name?.toLowerCase().includes('grade') ? grade.name : `Grade ${grade.name || grade.id}`}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="asset-sections">
            {['Categories', 'Courses', 'Workshops'].map((type) => (
              <div key={type} className={`asset-row ${expandedSections[type.toLowerCase()] ? 'open' : ''}`}>
                <div className="row-header" onClick={() => toggleSection(type.toLowerCase())}>
                  <div className="header-title">
                    <Layers size={18} className="icon" />
                    <span>{type}</span>
                    <span className="count-badge">
                      {formData.selectedAssets.filter(a => a.type === type).length} Selected
                    </span>
                  </div>
                  <div className="header-actions">
                    <button className="add-btn" onClick={(e) => { e.stopPropagation(); openPicker(type); }}>
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                    <ChevronDown size={18} className="chevron" />
                  </div>
                </div>
                <div className="row-content">
                  {formData.selectedAssets.filter(a => a.type === type).length > 0 ? (
                    <table className="assets-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.selectedAssets.filter(a => a.type === type).map((asset, idx) => (
                          <tr key={`${asset.type}-${asset.id}`}>
                            <td className="row-num">{idx + 1}</td>
                            <td className="asset-name-cell">{asset.title || asset.name}</td>
                            <td><span className="type-badge">{asset.category || '—'}</span></td>
                            <td>
                              <button
                                className="remove-row-btn"
                                onClick={() => handleAssetToggle(asset)}
                                title="Remove"
                              >×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">No {type.toLowerCase()} selected yet. Click <strong>+ Add</strong> to select.</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <section className="audience-summary-card glass">
            <div className="summary-info">
              <Users size={24} className="primary-icon" />
              <div className="text">
                <h3>Mapped Audience</h3>
                <p>This mapping will affect <strong className={countingUsers ? "pulse" : ""}>{countingUsers ? '...' : formData.affectedUsersCount}</strong> users.</p>
              </div>
            </div>
            <div className="quick-rules">
              <div className="rule-item">
                <label>Access Rule</label>
                <span>{formData.accessType === 'immediate' ? 'Instant Access' : 'Timed Access'}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `:root { --cols: ${formData.assignmentMode === 'School' ? 4 : 3}; }`
      }} />

      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title={`${pickerType} Mapping`}
      >
        <AssetPicker
          type={pickerType}
          onSelect={handleAssetToggle}
          selectedIds={formData.selectedAssets.filter(a => a.type === pickerType).map(a => a.id)}
          selectedFilters={formData}
          schools={schools}
          grades={grades}
          onFilterChange={handleFilterChange}
        />
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowPicker(false)}>Close</button>
          <button className="btn btn-primary" onClick={() => setShowPicker(false)}>Save Selections</button>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .mapping-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .mapping-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .mapping-header h1 {
          font-size: 32px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -1px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .mapping-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .config-card {
          display: grid;
          grid-template-columns: repeat(var(--cols, 3), 1fr);
          gap: 20px;
          padding: 24px;
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .filter-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .custom-select {
          position: relative;
          display: flex;
          align-items: center;
        }

        .custom-select select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 15px;
          appearance: none;
          background: #f8fafc;
          cursor: pointer;
          transition: var(--transition);
        }

        .custom-select select:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .custom-select svg {
          position: absolute;
          right: 16px;
          pointer-events: none;
          color: var(--text-muted);
        }

        .filter-group {
          position: relative;
        }

        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 50;
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .dropdown-checkbox-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 15px;
          color: var(--text-main);
        }

        .dropdown-checkbox-item:hover {
          background: #f8fafc;
        }

        .dropdown-checkbox-item input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
          accent-color: var(--primary);
        }

        .dropdown-checkbox-item:first-child {
          border-bottom: 1px solid var(--border-color);
          font-weight: 600;
        }

        .asset-sections {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .asset-row {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .asset-row.open {
          border-color: var(--primary);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          cursor: pointer;
          background: #f8fafc;
        }

        .row-header:hover {
          background: #f1f5f9;
        }

        .row-header .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .row-header .icon {
          color: var(--primary);
        }

        .row-header span {
          font-weight: 700;
          color: var(--text-main);
        }

        .count-badge {
          font-size: 12px;
          background: var(--primary-light);
          color: var(--primary);
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 8px;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: #166534;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          margin-right: 16px;
          transition: all 0.2s;
        }

        .add-btn:hover {
          background: #bbf7d0;
          transform: scale(1.05);
        }

        .chevron {
          transition: transform 0.3s;
          color: var(--text-muted);
        }

        .asset-row.open .chevron {
          transform: rotate(180deg);
        }

        .row-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
          padding: 0 24px;
        }

        .asset-row.open .row-content {
          max-height: 500px;
          padding: 20px 24px;
        }

        .empty-state {
          padding: 32px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
          border: 2px dashed #e2e8f0;
          border-radius: var(--radius-md);
        }

        .selected-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .asset-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          border: 1px solid #e2e8f0;
        }

        .asset-chip .remove {
          cursor: pointer;
          color: var(--danger);
          font-weight: 700;
        }

        .audience-summary-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: var(--primary-light);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-lg);
        }

        .summary-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .primary-icon {
          color: var(--primary);
        }

        .summary-info h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--primary);
          margin: 0;
        }

        .summary-info p {
          font-size: 14px;
          color: #4338ca;
          margin: 4px 0 0 0;
        }

        .btn {
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-secondary {
          background: white;
          border: 1px solid var(--border-color);
        }

        .success-badge {
          width: 64px;
          height: 64px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 24px;
        }

        .status-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }

        .error-toast {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fef2f2;
          color: #991b1b;
          padding: 12px 20px;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
          margin-bottom: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .error-toast button {
          margin-left: auto;
          background: transparent;
          color: #991b1b;
          font-size: 20px;
          font-weight: 700;
        }

        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        .assets-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          margin-top: 4px;
        }

        .assets-table thead tr {
          background: #f8fafc;
          border-bottom: 2px solid var(--border-color);
        }

        .assets-table th {
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: var(--text-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .assets-table tbody tr {
          border-bottom: 1px solid var(--border-color);
          transition: background 0.15s;
        }

        .assets-table tbody tr:last-child {
          border-bottom: none;
        }

        .assets-table tbody tr:hover {
          background: #f1f5f9;
        }

        .assets-table td {
          padding: 10px 14px;
          color: var(--text-main);
          vertical-align: middle;
        }

        .row-num {
          color: var(--text-muted);
          font-size: 12px;
          width: 36px;
        }

        .asset-name-cell {
          font-weight: 500;
        }

        .type-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          background: #eef2ff;
          color: var(--primary);
          text-transform: capitalize;
        }

        .remove-row-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 6px;
          line-height: 1;
          transition: all 0.15s;
        }

        .remove-row-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .audience-summary-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          margin-top: 32px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        }

        .summary-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .summary-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          color: var(--text-main);
        }

        .summary-info p {
          margin: 0;
          color: var(--text-muted);
          font-size: 14px;
        }

        .quick-rules {
          display: flex;
          gap: 16px;
        }

        .rule-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: white;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          min-width: 140px;
        }

        .rule-item label {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .rule-item span {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }
      ` }} />
    </Layout>
  );
};

export default MappingControlPage;
