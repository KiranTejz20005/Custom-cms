import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Plus, Users, Layers, Info, Trash2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import AssetPicker from '../components/mapping/AssetPicker';
import { createMapping, getMappingById, updateMapping, getMappings, getSchools, getGrades, getUserCount } from '../services/api';

const MappingControlPage = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [warningToast, setWarningToast] = useState(null);
  const [metaWarning, setMetaWarning] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [countingUsers, setCountingUsers] = useState(false);
  const [schools, setSchools] = useState([]);
  const [grades, setGrades] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateModalMessage, setDuplicateModalMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    courses: true,
    workshops: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [passkey, setPasskey] = useState('');

  const [isMappingTypeDropdownOpen, setIsMappingTypeDropdownOpen] = useState(false);
  const mappingTypeDropdownRef = useRef(null);

  const [isUserTypeDropdownOpen, setIsUserTypeDropdownOpen] = useState(false);
  const userTypeDropdownRef = useRef(null);

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
      if (mappingTypeDropdownRef.current && !mappingTypeDropdownRef.current.contains(event.target)) {
        setIsMappingTypeDropdownOpen(false);
      }
      if (userTypeDropdownRef.current && !userTypeDropdownRef.current.contains(event.target)) {
        setIsUserTypeDropdownOpen(false);
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

  const isMappingTypeSelected = String(formData.assignmentMode || '').trim() !== '';

  const getSelectedSchoolLabel = () => {
    if (!formData.schoolIds || formData.schoolIds.length === 0) return 'Choose School...';

    const names = formData.schoolIds
      .map((id) => schools.find((school) => Number(school.id) === Number(id))?.name)
      .filter(Boolean);

    return names.length > 0 ? names.join(', ') : `${formData.schoolIds.length} School(s) Selected`;
  };

  const getSelectedGradeLabel = () => {
    if (!formData.gradeIds || formData.gradeIds.length === 0) return 'Choose Grade...';

    const names = formData.gradeIds
      .map((id) => {
        const grade = grades.find((item) => Number(item.id) === Number(id));
        if (!grade) return null;
        return grade.name?.toLowerCase().includes('grade') ? grade.name : `Grade ${grade.name || grade.id}`;
      })
      .filter(Boolean);

    return names.length > 0 ? names.join(', ') : `${formData.gradeIds.length} Grade(s) Selected`;
  };

  const formatMappedDate = (timestamp) => {
    if (!timestamp) return '—';

    // Handle Xano timestamp format (milliseconds or ISO string)
    let date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      // Replace space with T for better ISO parsing if needed
      const normalizedString = String(timestamp).replace(' ', 'T');
      date = new Date(normalizedString);
    }

    if (isNaN(date.getTime())) return '—';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    // For very recent mapping (within 2 mins), show "Just now"
    if (diffMins >= 0 && diffMins < 2) {
      return 'Just now';
    }

    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long'
    });
    return `${dateStr}, ${timeStr}`;
  };

  useEffect(() => {
    const fetchWithRetry = async (fn, retries = 3, delayMs = 800) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (err) {
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
          } else {
            throw err;
          }
        }
      }
    };

    const fetchInitialData = async () => {
      let schoolsFailed = false;
      let gradesFailed = false;

      try {
        const schoolsRes = await fetchWithRetry(() => getSchools());
        const schoolData = Array.isArray(schoolsRes) ? schoolsRes : (schoolsRes.data || []);
        setSchools(schoolData);
      } catch (err) {
        console.error("Failed to fetch schools after retries:", err);
        schoolsFailed = true;
      }

      try {
        const gradesRes = await fetchWithRetry(() => getGrades());
        const gradeData = Array.isArray(gradesRes) ? gradesRes : (gradesRes.data || []);
        const sortedGrades = [...gradeData].sort((a, b) => {
          const numA = parseInt(a.name?.replace(/\D/g, '') || a.id);
          const numB = parseInt(b.name?.replace(/\D/g, '') || b.id);
          return numA - numB;
        });
        setGrades(sortedGrades);
      } catch (err) {
        console.error("Failed to fetch grades after retries:", err);
        gradesFailed = true;
      }

      if (schoolsFailed || gradesFailed) {
        const which = [schoolsFailed && 'schools', gradesFailed && 'grades'].filter(Boolean).join(' and ');
        setMetaWarning(`Could not load ${which} from Xano. You can still map assets — retry or check your API connection.`);
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
            schoolIds: m.school_id ? [m.school_id] : [],
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

  const normalizeNumberArray = (values) => {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.map((value) => Number(value)).filter(Number.isFinite))].sort((a, b) => a - b);
  };

  const hasCompleteAudienceFilters = () => {
    if (!formData.userType) return false;
    if (!formData.gradeIds || formData.gradeIds.length === 0) return false;
    if (formData.userType === 'School' && (!formData.schoolIds || formData.schoolIds.length === 0)) return false;
    return true;
  };

  const refreshMappedAssetsForFilters = async () => {
    if (!hasCompleteAudienceFilters()) {
      setFormData(prev => ({ ...prev, selectedAssets: [] }));
      return;
    }

    try {
      const resp = await getMappings();
      const mappings = Array.isArray(resp) ? resp : (resp.items || resp.data || []);

      const selectedGrades = normalizeNumberArray(formData.gradeIds);
      const selectedSchools = normalizeNumberArray(formData.schoolIds);
      const selectedUserType = String(formData.userType || '').toLowerCase();

      const mappedAssets = mappings
        .filter((mapping) => {
          const contentType = String(mapping?.content_type || '').toLowerCase();
          if (!(contentType === 'course' || contentType === 'workshop')) return false;

          const mappingGrades = normalizeNumberArray(
            Array.isArray(mapping?.grade_ids)
              ? mapping.grade_ids
              : (mapping?.grade_id != null ? [mapping.grade_id] : [])
          );

          if (selectedGrades.length > 0 && !selectedGrades.every((gradeId) => mappingGrades.includes(gradeId))) {
            return false;
          }

          const mappingSchoolId = Number(mapping?.school_id || mapping?.school?.id || mapping?.school || 0) || 0;
          const mappingSubscription = String(mapping?.subscription_type || '').toLowerCase();

          if (selectedUserType === 'school') {
            if (selectedSchools.length === 0) return false;
            if (!selectedSchools.includes(mappingSchoolId)) return false;
            return mappingSubscription === 'premium' || mappingSubscription === 'school' || mappingSubscription === '';
          }

          if (selectedUserType === 'all') {
            return mappingSchoolId === 0 && !mappingSubscription;
          }

          return mappingSchoolId === 0 && mappingSubscription === selectedUserType;
        })
        .map((mapping) => {
          const rawType = String(mapping.content_type || '').toLowerCase();
          const type = rawType === 'workshop' ? 'Workshops' : 'Courses';
          return {
            id: mapping.content_id,
            title: mapping.content_title || `${type.slice(0, -1)} ${mapping.content_id}`,
            type,
            category: mapping.category || '—',
            isExisting: true,
            mappedAt: mapping.created_at || mapping._created_at || mapping.timestamp || Date.now(),
          };
        });

      const dedupedAssets = [];
      const seen = new Set();
      mappedAssets.forEach((asset) => {
        const key = `${asset.type}-${asset.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          dedupedAssets.push(asset);
        }
      });

      setFormData(prev => ({ ...prev, selectedAssets: dedupedAssets }));
    } catch (err) {
      console.error('Failed to refresh mapped assets for current filters', err);
    }
  };

  useEffect(() => {
    refreshMappedAssetsForFilters();
  }, [formData.userType, formData.gradeIds, formData.schoolIds]);

  const retryMeta = async () => {
    setMetaWarning(null);
    const fetchWithRetry = async (fn, retries = 3, delayMs = 800) => {
      for (let i = 0; i < retries; i++) {
        try { return await fn(); }
        catch (err) {
          if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
          else throw err;
        }
      }
    };
    let warn = [];
    try {
      const sRes = await fetchWithRetry(() => getSchools());
      setSchools(Array.isArray(sRes) ? sRes : (sRes.data || []));
    } catch { warn.push('schools'); }
    try {
      const gRes = await fetchWithRetry(() => getGrades());
      const gData = Array.isArray(gRes) ? gRes : (gRes.data || []);
      setGrades([...gData].sort((a, b) => parseInt(a.name?.replace(/\D/g, '') || a.id) - parseInt(b.name?.replace(/\D/g, '') || b.id)));
    } catch { warn.push('grades'); }
    if (warn.length) setMetaWarning(`Still could not load ${warn.join(' and ')}. Check Xano API connection.`);
  };

  useEffect(() => {
    if (!warningToast) return undefined;
    const timeout = setTimeout(() => setWarningToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [warningToast]);

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
      'Bytes': 'byte'
    };

    const allowedContentTypes = new Set(['course', 'workshop', 'book', 'byte']);
    const allowedSubscriptionTypes = new Set(['basic', 'premium', 'ultra']);

    const normalizeGradeIds = (gradeIds) => {
      if (Array.isArray(gradeIds)) {
        return [...new Set(gradeIds.map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
      }
      if (gradeIds == null) return [];
      const numeric = Number(gradeIds);
      return Number.isFinite(numeric) ? [numeric] : [];
    };

    const normalizeContentId = (raw) => {
      if (raw == null) return null;
      const asString = String(raw).trim();
      return asString || null;
    };

    const comparableContentId = (raw) => {
      const normalized = normalizeContentId(raw);
      return normalized == null ? '' : String(normalized);
    };

    const normalizeSchoolId = (raw) => {
      if (raw == null) return 0;
      if (typeof raw === 'object') {
        const nested = raw.id ?? raw.school_id ?? 0;
        const asNumber = Number(nested);
        return Number.isFinite(asNumber) ? asNumber : 0;
      }
      const asNumber = Number(raw);
      return Number.isFinite(asNumber) ? asNumber : 0;
    };

    const normalizeComparableCategory = (raw) => String(raw || '').trim().toLowerCase();

    const normalizeGradesComparable = (gradeIds) => normalizeGradeIds(gradeIds).join(',');

    let existingMappings = [];
    try {
      const resp = await getMappings();
      existingMappings = Array.isArray(resp) ? resp : (resp.items || resp.data || []);
    } catch (err) {
      console.warn('Duplicate validation fetch failed. Proceeding with local dedupe only.', err);
      setWarningToast('Duplicate validation is temporarily unavailable. Proceeding with local checks.');
      existingMappings = [];
    }

    const buildPayload = (asset) => {
      const contentType = typeMap[asset.type] || (asset.type || '').toLowerCase();
      if (!allowedContentTypes.has(contentType)) {
        throw new Error(`Unsupported content_type: ${contentType || 'unknown'}`);
      }

      const contentId = normalizeContentId(asset.id);
      if (contentId == null) {
        throw new Error(`Invalid content_id for asset: ${asset.title || asset.name || 'Unknown asset'}`);
      }

      const rawUserType = (formData.userType || '').toLowerCase();
      const isAllUserGroups = rawUserType === 'all' || formData.userType === 'All User Groups';
      let subscriptionType = isAllUserGroups
        ? null
        : (rawUserType === 'school' ? 'premium' : rawUserType);

      if (subscriptionType && !allowedSubscriptionTypes.has(subscriptionType)) {
        console.warn('Invalid subscription_type derived from formData.userType:', {
          userType: formData.userType,
          derived: subscriptionType,
          assetType: asset.type,
          assetCategory: asset.category,
          assetTitle: asset.title || asset.name,
        });
        subscriptionType = null;
      }

      const payload = {
        content_type: contentType,
        content_id: String(asset.id),
        content_title: asset.title || asset.name || '',
        grade_ids: formData.gradeIds?.length > 0 ? formData.gradeIds : [],
        is_active: true,
        assigned_by: 1,
        category: asset.category || '',
        ...(subscriptionType ? { subscription_type: subscriptionType } : {}),
      };

      console.log('Payload:', JSON.stringify({
        ...payload,
        _asset_type: asset.type || null,
        _asset_category: asset.category ?? null,
      }));
      console.log('Full payload before send:', JSON.stringify(payload));

      return payload;
    };

    try {
      const allPayloads = [];
      const mappableAssets = formData.selectedAssets.filter(asset => (asset.type === 'Courses' || asset.type === 'Workshops') && !asset.isExisting);

      if (mappableAssets.length === 0) {
        setError('Please add at least one Course or Workshop to map.');
        setSubmitting(false);
        return;
      }

      mappableAssets.forEach(asset => {
        const basePayload = buildPayload(asset);
        const targetSchools = formData.userType === 'School' && formData.schoolIds?.length > 0
          ? formData.schoolIds
          : [0];
        targetSchools.forEach(schoolId => {
          const normalizedSchoolId = Number(schoolId);
          allPayloads.push({
            ...basePayload,
            school_id: Number.isFinite(normalizedSchoolId) ? normalizedSchoolId : 0
          });
        });
      });

      if (allPayloads.length === 0) {
        setError("No assets selected to map.");
        setSubmitting(false);
        return;
      }

      const dedupedPayloads = [];
      const requestKeys = new Set();
      allPayloads.forEach((payload) => {
        const key = [
          payload.content_type,
          comparableContentId(payload.content_id),
          normalizeGradeIds(payload.grade_ids).join(','),
          String(payload.school_id ?? 0),
          payload.subscription_type || 'all',
        ].join('|');

        if (!requestKeys.has(key)) {
          requestKeys.add(key);
          dedupedPayloads.push(payload);
        }
      });

      const isSameAudience = (existing, payload) => {
        const existingSchool = normalizeSchoolId(existing.school ?? existing.school_id);
        const payloadSchool = normalizeSchoolId(payload.school_id);
        const existingSubscription = String(existing.subscription_type || '').toLowerCase();
        const payloadSubscription = String(payload.subscription_type || '').toLowerCase();
        const existingGrades = normalizeGradesComparable(existing.grade_ids ?? existing.grade_id);
        const payloadGrades = normalizeGradesComparable(payload.grade_ids);
        return existingSchool === payloadSchool
          && existingSubscription === payloadSubscription
          && existingGrades === payloadGrades;
      };

      const isDuplicateMapping = (existing, payload) => {
        if (!isSameAudience(existing, payload)) return false;

        const existingType = String(existing.content_type || '').toLowerCase();
        const payloadType = String(payload.content_type || '').toLowerCase();
        if (existingType !== payloadType) return false;

        if (payloadType === 'category') {
          const existingCategory = normalizeComparableCategory(existing.category || existing.content_title);
          const payloadCategory = normalizeComparableCategory(payload.category || payload.content_title);
          if (existingCategory && payloadCategory) {
            return existingCategory === payloadCategory;
          }
        }

        return comparableContentId(existing.content_id) === comparableContentId(payload.content_id);
      };

      const duplicatePayloads = [];
      const payloadsToSave = [];

      dedupedPayloads.forEach((payload) => {
        const duplicateFound = existingMappings.some((existing) => {
          if (mode === 'edit' && Number(existing.id) === Number(id)) {
            return false;
          }
          return isDuplicateMapping(existing, payload);
        });

        if (duplicateFound) {
          duplicatePayloads.push(payload);
        } else {
          payloadsToSave.push(payload);
        }
      });

      if (duplicatePayloads.length > 0) {
        const duplicateTitles = [...new Set(duplicatePayloads.map(p => p.content_title || p.content_id))];
        setDuplicateModalMessage('Duplicate mapping is not allowed. The mapping you are trying to do already exists.');
        setShowDuplicateModal(true);
        setWarningToast(`Skipped duplicate assets: ${duplicateTitles.join(', ')}`);
      }

      if (payloadsToSave.length === 0) {
        setSubmitting(false);
        return;
      }

      if (mode === 'edit') {
        if (payloadsToSave.length !== 1) {
          setError('Edit mode supports updating a single mapping. Please keep one asset and one audience selection.');
          setSubmitting(false);
          return;
        }
        const editPayload = payloadsToSave[0];
        console.log('Payload:', JSON.stringify(editPayload));
        const editResult = await updateMapping(id, editPayload);
        console.log('Result:', { status: 'fulfilled', value: editResult, payload: editPayload });
        await refreshMappedAssetsForFilters();
        setWarningToast('Mapping updated successfully.');
        return;
      }

      const results = [];
      for (const payload of payloadsToSave) {
        try {
          const value = await createMapping(payload);
          const result = { status: 'fulfilled', value, payload };
          console.log('Result:', result);
          results.push(result);
        } catch (reason) {
          const result = { status: 'rejected', reason, payload };
          console.log('Result:', result);
          console.error('Failed payload:', JSON.stringify(payload), reason);
          results.push(result);
        }
      }

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.length - successCount;
      if (successCount === 0) {
        throw new Error('All mapping requests failed.');
      }
      if (failedCount > 0) {
        setError(`Saved ${successCount} mapping(s), but ${failedCount} failed. Check browser console for failed payloads.`);
        return;
      }
      await refreshMappedAssetsForFilters();
      setWarningToast('Mappings applied successfully.');

    } catch (err) {
      setError(`Failed to save mappings: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

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
        {warningToast && (
          <div className="meta-warning-toast animate-slide-in">
            <Info size={18} />
            <span>{warningToast}</span>
            <button onClick={() => setWarningToast(null)}>×</button>
          </div>
        )}
        {metaWarning && (
          <div className="meta-warning-toast animate-slide-in">
            <Info size={18} />
            <span>{metaWarning}</span>
            <button className="retry-meta-btn" onClick={retryMeta}>↺ Retry</button>
            <button onClick={() => setMetaWarning(null)}>×</button>
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
          <section className="config-card glass" style={{ display: 'flex', flexDirection: 'row', gap: '16px', padding: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
            <div className="combo-select combo-dropdown dropdown-container" ref={mappingTypeDropdownRef} style={{ position: 'relative' }}>
              <span className="combo-label">Mapping Type</span>
              <span className="combo-divider"></span>
              <div className="combo-trigger" onClick={() => setIsMappingTypeDropdownOpen(!isMappingTypeDropdownOpen)}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: formData.assignmentMode ? '#1e293b' : '#64748b' }}>
                  {formData.assignmentMode || 'Select'}
                </span>
                <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
              </div>

              {isMappingTypeDropdownOpen && (
                <div className="paged-dropdown-menu custom-combo-menu animate-slide-in" style={{ zIndex: 105, marginTop: '8px' }}>
                  <div className="dropdown-options-list">
                    {['User', 'Asset'].map(option => (
                      <label key={option} className="menu-item-check">
                        <input
                          type="checkbox"
                          checked={formData.assignmentMode === option}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              assignmentMode: option,
                              userType: '',
                              schoolIds: [],
                              gradeIds: [],
                            }));
                            setIsMappingTypeDropdownOpen(false);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {isMappingTypeSelected && (
              <div className="combo-select combo-dropdown dropdown-container animate-slide-in" ref={userTypeDropdownRef} style={{ position: 'relative' }}>
                <span className="combo-label">User Type</span>
                <span className="combo-divider"></span>
                <div className="combo-trigger" onClick={() => setIsUserTypeDropdownOpen(!isUserTypeDropdownOpen)}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: formData.userType ? '#1e293b' : '#64748b' }}>
                    {formData.userType ? (formData.userType === 'all' ? 'All' : formData.userType) : 'Select'}
                  </span>
                  <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                </div>

                {isUserTypeDropdownOpen && (
                  <div className="paged-dropdown-menu custom-combo-menu animate-slide-in" style={{ zIndex: 104, marginTop: '8px' }}>
                    <div className="dropdown-options-list">
                      {['all', 'Premium', 'Ultra', 'School'].map(option => (
                        <label key={option} className="menu-item-check">
                          <input
                            type="checkbox"
                            checked={formData.userType === option}
                            onChange={() => {
                              setFormData({ ...formData, userType: option, schoolIds: [], gradeIds: [] });
                              setIsUserTypeDropdownOpen(false);
                            }}
                          />
                          <span>{option === 'all' ? 'All' : option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(formData.assignmentMode === 'User' && formData.userType === 'School') && (
              <div className="combo-select combo-dropdown dropdown-container animate-slide-in" ref={schoolDropdownRef} style={{ position: 'relative' }}>
                <span className="combo-label">School</span>
                <span className="combo-divider"></span>
                <div className="combo-trigger" onClick={() => formData.assignmentMode && setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: formData.schoolIds?.length > 0 ? '#1e293b' : '#64748b' }}>
                    {getSelectedSchoolLabel()}
                  </span>
                  <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                </div>

                {isSchoolDropdownOpen && (
                  <div className="paged-dropdown-menu custom-combo-menu animate-slide-in">
                    <label className="menu-item-check all-option">
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
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-options-list">
                      {schools.map(school => (
                        <label key={school.id} className="menu-item-check">
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
                  </div>
                )}
              </div>
            )}
            {(formData.userType !== '' && (formData.userType !== 'School' || (formData.schoolIds && formData.schoolIds.length > 0))) && (
              <div className="combo-select combo-dropdown dropdown-container animate-slide-in" ref={gradeDropdownRef} style={{ position: 'relative' }}>
                <span className="combo-label">Grade</span>
                <span className="combo-divider"></span>
                <div className="combo-trigger" onClick={() => formData.assignmentMode && setIsGradeDropdownOpen(!isGradeDropdownOpen)}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: formData.gradeIds.length > 0 ? '#1e293b' : '#64748b' }}>
                    {getSelectedGradeLabel()}
                  </span>
                  <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '6px' }} />
                </div>

                {isGradeDropdownOpen && (
                  <div className="paged-dropdown-menu custom-combo-menu animate-slide-in">
                    <label className="menu-item-check all-option">
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
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-options-list">
                      {grades.map(grade => (
                        <label key={grade.id} className="menu-item-check">
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
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="asset-sections">
            {['Courses', 'Workshops'].map((type) => (
              <div key={type} className={`asset-row ${expandedSections[type.toLowerCase()] ? 'open' : ''}`}>
                <div className="row-header" onClick={() => toggleSection(type.toLowerCase())}>
                  <div className="header-title">
                    <Layers size={18} className="icon" />
                    <span>{type}</span>
                    <span className="count-badge">
                      {(() => {
                        const assets = formData.selectedAssets.filter(a => a.type === type);
                        const mappedCount = assets.filter(a => a.isExisting).length;
                        const selectedCount = assets.filter(a => !a.isExisting).length;

                        const parts = [];
                        if (mappedCount > 0) parts.push(`${mappedCount} Mapped`);
                        if (selectedCount > 0) parts.push(`${selectedCount} Selected`);

                        return parts.length > 0 ? parts.join(' · ') : '0 Selected';
                      })()}
                    </span>
                  </div>
                  <div className="header-actions">
                    <button
                      className="add-btn"
                      onClick={(e) => { e.stopPropagation(); openPicker(type); }}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                    <ChevronDown size={18} className="chevron" />
                  </div>
                </div>
                <div className="row-content">
                  {(() => {
                    const assets = formData.selectedAssets.filter(a => a.type === type);
                    const mappedAssets = assets.filter(a => a.isExisting);
                    const newlySelectedAssets = assets.filter(a => !a.isExisting);

                    if (assets.length === 0) {
                      return <div className="empty-state">No {type.toLowerCase()} selected yet. Click <strong>+ Add</strong> to select.</div>;
                    }

                    return (
                      <div className="split-asset-tables">
                        {mappedAssets.length > 0 && (
                          <div className="asset-sub-section">
                            <h5 className="sub-section-title">Already Mapped Assets</h5>
                            <table className="assets-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Name</th>
                                  <th>Category</th>
                                  <th>Mapped Date</th>
                                  <th>Move to Bin</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mappedAssets.map((asset, idx) => (
                                  <tr key={`mapped-${asset.id}`}>
                                    <td className="row-num">{idx + 1}</td>
                                    <td className="asset-name-cell">{asset.title || asset.name}</td>
                                    <td><span className="type-badge">{asset.category || '—'}</span></td>
                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                      {formatMappedDate(asset.mappedAt)}
                                    </td>
                                    <td>
                                      <button
                                        className="remove-row-btn bin-btn"
                                        onClick={() => {
                                          setAssetToDelete(asset);
                                          setShowDeleteModal(true);
                                        }}
                                        title="Move to Bin"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {newlySelectedAssets.length > 0 && (
                          <div className="asset-sub-section" style={{ marginTop: mappedAssets.length > 0 ? '24px' : '0' }}>
                            <h5 className="sub-section-title">Newly Selected Assets</h5>
                            <table className="assets-table newly-selected">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Name</th>
                                  <th>Category</th>
                                  <th>Status</th>
                                  <th>Remove</th>
                                </tr>
                              </thead>
                              <tbody>
                                {newlySelectedAssets.map((asset, idx) => (
                                  <tr key={`selected-${asset.id}`}>
                                    <td className="row-num">{idx + 1}</td>
                                    <td className="asset-name-cell">{asset.title || asset.name}</td>
                                    <td><span className="type-badge">{asset.category || '—'}</span></td>
                                    <td style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Pending</td>
                                    <td>
                                      <button
                                        className="remove-row-btn bin-btn"
                                        onClick={() => handleAssetToggle(asset)}
                                        title="Remove"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title={`Move ${assetToDelete?.isExisting ? (pickerType === 'Workshops' ? 'Workshop' : 'Course') : 'Selection'} to Bin`}
          >
            <div className="wm-delete-modal-v2">
              <div className="wm-delete-sidebar">
                <div className="wm-warning-icon">!</div>
              </div>
              <div className="wm-delete-content">
                <p className="wm-delete-msg">Are you sure you want to move <strong>"{assetToDelete?.title || assetToDelete?.name}"</strong> to Bin.</p>
                <p className="wm-delete-subtext">This will temporarily "UN-map" {pickerType === 'Workshops' ? 'Workshop' : 'Course'}, you can undo this action from "Bin"</p>

                <div className="wm-passkey-group">
                  <div className="wm-passkey-box">
                    <span className="wm-passkey-label">Enter admin passkey *</span>
                    <input
                      type="password"
                      className="wm-passkey-field"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      placeholder="******"
                    />
                  </div>
                </div>

                <div className="wm-delete-footer">
                  <button className="wm-discard-btn-v2" onClick={() => setShowDeleteModal(false)}>Discard</button>
                  <button
                    className="wm-confirm-btn-v2"
                    onClick={() => {
                      if (assetToDelete) handleAssetToggle(assetToDelete);
                      setShowDeleteModal(false);
                      setPasskey('');
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Yes, move to Bin</span>
                  </button>
                </div>
              </div>
            </div>
          </Modal>

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

      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicate Mapping Not Allowed"
      >
        <div className="duplicate-modal-content">
          <p>{duplicateModalMessage || 'Duplicate mapping is not allowed. The mapping you are trying to do already exists.'}</p>
          <div className="duplicate-modal-actions">
            <button className="btn btn-primary" onClick={() => setShowDuplicateModal(false)}>Got it</button>
          </div>
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

        .filter-group label.filter-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: block;
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
          max-height: 1000px;
          overflow-y: auto;
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

        .success-toast-page {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding-top: 8px;
        }

        .success-toast-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-left: 5px solid #22c55e;
          border-radius: 10px;
          padding: 18px 24px;
          max-width: 520px;
          box-shadow: 0 4px 12px rgba(34,197,94,0.1);
        }

        .success-icon {
          width: 40px;
          height: 40px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .success-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .success-text strong {
          font-size: 16px;
          font-weight: 700;
          color: #15803d;
        }

        .success-text span {
          font-size: 13px;
          color: #166534;
          opacity: 0.85;
        }


        .meta-warning-toast {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fffbeb;
          color: #92400e;
          padding: 12px 20px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          margin-bottom: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.06);
          font-size: 14px;
        }

        .meta-warning-toast button {
          background: transparent;
          color: #92400e;
          font-size: 16px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        .retry-meta-btn {
          margin-left: auto;
          background: #f59e0b !important;
          color: white !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          padding: 4px 14px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .retry-meta-btn:hover {
          background: #d97706 !important;
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

        .duplicate-modal-content p {
          margin: 0;
          color: var(--text-main);
          line-height: 1.6;
          font-size: 15px;
        }

        .duplicate-modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .bin-btn {
          color: #64748b !important;
          transition: all 0.2s;
          display: flex !important;
          align-items: center;
          justify-content: center;
          padding: 6px !important;
          border-radius: 6px !important;
          border: none !important;
          background: transparent !important;
        }

        .bin-btn:hover {
          background: #fee2e2 !important;
          color: #ef4444 !important;
        }

        .wm-delete-modal {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wm-delete-msg {
          font-size: 16px;
          color: #1e293b;
          margin: 0;
        }

        .wm-delete-subtext {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .wm-passkey-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .wm-passkey-section label {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .passkey-input {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #10b981;
          background: #f8fafc;
          outline: none;
          width: 100%;
        }

        .delete-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }

        .discard-btn {
          padding: 10px 24px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
        }

        .confirm-delete-btn {
          padding: 10px 20px;
          border-radius: 6px;
          background: #2563eb;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .confirm-delete-btn:hover {
          background: #1d4ed8;
        }

        .sub-section-title {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sub-section-title::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .assets-table.newly-selected tr {
          background-color: #f0f7ff;
        }

        /* Redesigned Modal Styles */
        .wm-delete-modal-v2 {
          display: flex;
          min-height: 280px;
          margin: -24px; /* remove modal padding */
        }

        .wm-delete-sidebar {
          width: 120px;
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .wm-warning-icon {
          width: 50px;
          height: 50px;
          border: 2.5px solid #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          font-size: 28px;
          font-weight: 700;
          position: relative;
        }

        .wm-warning-icon::before {
           content: "";
           position: absolute;
           top: -8px;
           left: 50%;
           transform: translateX(-50%);
           border-left: 10px solid transparent;
           border-right: 10px solid transparent;
           border-bottom: 20px solid transparent;
        }

        .wm-delete-content {
          flex: 1;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .wm-modal-headline {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .wm-delete-msg {
          font-size: 15px;
          color: #1e293b;
          line-height: 1.5;
          margin: 0;
        }

        .wm-delete-subtext {
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        .wm-passkey-group {
          margin-top: 12px;
        }

        .wm-passkey-box {
          display: flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          background: white;
        }

        .wm-passkey-label {
          padding: 10px 14px;
          background: #f8fafc;
          border-right: 1px solid #cbd5e1;
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
        }

        .wm-passkey-field {
          flex: 1;
          border: none;
          padding: 10px 14px;
          font-size: 14px;
          background: transparent;
          outline: none;
        }

        .wm-delete-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
        }

        .wm-discard-btn-v2 {
          padding: 10px 24px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #3b82f6;
          font-weight: 600;
          font-size: 14px;
        }

        .wm-confirm-btn-v2 {
          background: #dc2626;
          color: white;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
        }

        .wm-confirm-btn-v2:hover {
          background: #b91c1c;
        }
      ` }} />
    </Layout>
  );
};

export default MappingControlPage;
