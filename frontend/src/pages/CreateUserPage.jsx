import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Plus, Trash2, Upload, Search, Check, Layers, ChevronDown } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import { getGrades, getSchools, getCourses, getWorkshops, getMappings, createStudent, getUsers } from '../services/api';
import AssetPicker from '../components/mapping/AssetPicker';

const STEPS = ['Student Details', 'Map & Publish'];

const CreateUserPage = () => {
    const navigate = useNavigate();

    // Step
    const [step, setStep] = useState(1);

    // Meta
    const [grades, setGrades] = useState([]);
    const [schools, setSchools] = useState([]);

    // Step 1 form
    const [surname, setSurname] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [subscriptionType, setSubscriptionType] = useState('');
    const [gradeId, setGradeId] = useState('');
    const [parentName, setParentName] = useState('');
    const [address, setAddress] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [institution, setInstitution] = useState('');
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Created student from step 1
    const [createdStudent, setCreatedStudent] = useState(null);

    // Step 2 — mapping
    const [courses, setCourses] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [selectedWorkshops, setSelectedWorkshops] = useState([]);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showWorkshopModal, setShowWorkshopModal] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [workshopSearch, setWorkshopSearch] = useState('');
    const [applyingMappings, setApplyingMappings] = useState(false);
    const [mappingApplied, setMappingApplied] = useState(false);
    const [pickerType, setPickerType] = useState(null);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [existingMappedCourses, setExistingMappedCourses] = useState([]);
    const [existingMappedWorkshops, setExistingMappedWorkshops] = useState([]);

    // Redirect to step 1 if refreshed on step 2 (state is lost)
    useEffect(() => {
        if (step === 2 && !createdStudent) {
            setStep(1);
        }
    }, []);

    // Fetch meta on mount
    useEffect(() => {
        const load = async () => {
            try {
                const [gRes, sRes] = await Promise.all([getGrades(), getSchools()]);
                const gData = Array.isArray(gRes) ? gRes : (gRes.data || []);
                setGrades([...gData].sort((a, b) => Number(a.id) - Number(b.id)));
                setSchools(Array.isArray(sRes) ? sRes : (sRes.data || []));
            } catch (e) { console.error('Failed loading meta', e); }
        };
        load();
    }, []);

    // Fetch courses & workshops and existing mappings when entering step 2
    useEffect(() => {
        if (step !== 2) return;
        const fetchAssets = async () => {
            setLoadingAssets(true);
            try {
                const [cRes, wRes, mappingsRes] = await Promise.all([getCourses(), getWorkshops(), getMappings()]);
                const extract = (r) => Array.isArray(r) ? r : (r?.items || r?.data || r?.results || []);
                setCourses(extract(cRes));
                setWorkshops(extract(wRes));

                const mappings = Array.isArray(mappingsRes) ? mappingsRes : (mappingsRes?.items || mappingsRes?.data || []);
                const normalizeGrades = (ids) => (Array.isArray(ids) ? ids : ids != null ? [ids] : []).map(Number);
                const normalizeNum = (val) => {
                    if (val == null) return null;
                    if (typeof val === 'object') {
                        const n = Number(val.id ?? val.school_id ?? null);
                        return Number.isFinite(n) ? n : null;
                    }
                    const n = Number(val);
                    return Number.isFinite(n) ? n : null;
                };

                const selectedSchoolIds = subscriptionType === 'school' && schoolId ? [Number(schoolId)] : [];

                const matched = mappings.filter(m => {
                    // Grade match
                    const mGrades = normalizeGrades(m.grade_ids ?? m.grade_id);
                    if (!mGrades.includes(Number(gradeId))) return false;

                    const entitlementSchool = normalizeNum(m?.school ?? m?.school_id) || 0;
                    const subscription = (m?.subscription_type || '').toLowerCase();
                    const userSub = subscriptionType.toLowerCase();

                    if (userSub === 'school') {
                        if (entitlementSchool <= 0) return false;
                        if (!(subscription === 'premium' || subscription === 'school' || subscription === '')) return false;
                        // Must match the specific school
                        if (!selectedSchoolIds.includes(entitlementSchool)) return false;
                    } else {
                        // premium / ultra: must match subscription exactly, school_id must be 0
                        if (subscription !== userSub) return false;
                        if (entitlementSchool > 0) return false;
                    }

                    return true;
                });
                const mappedCourses = matched
                    .filter(m => (m.content_type || '').toLowerCase() === 'course')
                    .map(m => ({
                        id: m.content_id,
                        title: m.content_title || m.content_id,
                        category: m.category || '—',
                        mappedAt: m.created_at || Date.now(),
                        isExisting: true,
                    }));
                const mappedWorkshops = matched
                    .filter(m => (m.content_type || '').toLowerCase() === 'workshop')
                    .map(m => ({
                        id: m.content_id,
                        title: m.content_title || m.content_id,
                        category: m.category || '—',
                        mappedAt: m.created_at || Date.now(),
                        isExisting: true,
                    }));
                setExistingMappedCourses(mappedCourses);
                setExistingMappedWorkshops(mappedWorkshops);
            } catch (e) { console.error('Failed loading assets', e); }
            finally { setLoadingAssets(false); }
        };
        fetchAssets();
    }, [step, gradeId, subscriptionType, schoolId]);

    /* ── Step 1 Validation ── */
    const validate = () => {
        const errs = {};
        if (!surname.trim()) errs.surname = 'Surname is required';
        if (!firstName.trim()) errs.firstName = 'First Name is required';
        if (!lastName.trim()) errs.lastName = 'Last Name is required';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
        if (!subscriptionType) errs.subscriptionType = 'Subscription Type is required';
        if (!gradeId) errs.gradeId = 'Grade is required';
        if (subscriptionType === 'school' && !schoolId) errs.schoolId = 'Please select a school';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    /* ── Step 1 Submit ── */
    const handleNext = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            // Check for duplicate email/mobile
            const existingUsers = await getUsers();
            const allUsers = Array.isArray(existingUsers?.data) ? existingUsers.data : (Array.isArray(existingUsers) ? existingUsers : []);
            const duplicate = allUsers.find(u =>
                u.email?.toLowerCase() === email.toLowerCase() ||
                (mobile && u.mobile && u.mobile === mobile)
            );
            if (duplicate) {
                if (duplicate.email?.toLowerCase() === email.toLowerCase()) {
                    setErrors(prev => ({ ...prev, email: 'A user with this email already exists.' }));
                } else {
                    setErrors(prev => ({ ...prev, mobile: 'A user with this mobile number already exists.' }));
                }
                setSaving(false);
                return;
            }
            const body = {
                first_name_: firstName.trim(),
                last_name_: (lastName || '').trim(),
                surname_: (surname || '').trim(),
                email: email.trim(),
                password: 'Test@1234',
                grade_level: Number(gradeId),
                school_id: subscriptionType === 'school' ? Number(schoolId) : 0,
                subscription_type: subscriptionType.toLowerCase(),
                mobile: mobile,
                mobile_: mobile,
            };

            const res = await createStudent(body);

            const studentId = res?.id || res?.data?.id || res?.user_id;
            setCreatedStudent({
                id: studentId,
                name: [surname, firstName, lastName].filter(Boolean).join(' ').trim(),
                email: email.trim(),
                subscription_type: subscriptionType,
                grade: gradeId,
                school: schoolId,
            });
            setStep(2);
        } catch (err) {
            console.error('Failed to create student:', err);
            showToast(err?.message || 'Error creating student. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── Step 1 Reset ── */
    const handleReset = () => {
        setSurname(''); setFirstName(''); setLastName('');
        setMobile(''); setEmail(''); setSubscriptionType('');
        setGradeId(''); setParentName('');
        setAddress(''); setSchoolId(''); setInstitution('');
        setErrors({});
    };

    const handleOpenPicker = (type) => {
        setPickerType(type);
        setShowAssetPicker(true);
    };

    const handleAssetToggle = (asset) => {
        const setter = asset.type === 'Workshops' ? setSelectedWorkshops : setSelectedCourses;
        setter(prev => {
            const exists = prev.some(item => item.id === asset.id);
            if (exists) return prev.filter(item => item.id !== asset.id);
            return [...prev, asset];
        });
    };

    /* ── Step 2 — toggle course/workshop selection in modal ── */
    const toggleCourse = (course) => {
        setSelectedCourses(prev => {
            const exists = prev.find(c => c.id === course.id);
            return exists ? prev.filter(c => c.id !== course.id) : [...prev, course];
        });
    };
    const toggleWorkshop = (workshop) => {
        setSelectedWorkshops(prev => {
            const exists = prev.find(w => w.id === workshop.id);
            return exists ? prev.filter(w => w.id !== workshop.id) : [...prev, workshop];
        });
    };
    const removeCourse = (id) => setSelectedCourses(prev => prev.filter(c => c.id !== id));
    const removeWorkshop = (id) => setSelectedWorkshops(prev => prev.filter(w => w.id !== id));

    /* ── Step 2 — Apply Mappings ── */
    const handleApplyMappings = async () => {
        if (!createdStudent?.id) return;
        setApplyingMappings(true);
        try {
            const promises = [];
            for (const course of selectedCourses) {
                promises.push(
                    createMapping({
                        type: subscriptionType === 'school' ? 'school' : 'subscription',
                        content_id: String(course.id || course.content_id),
                        content_type: 'course',
                        content_title: course.title || course.content_title,
                        subscription_type: subscriptionType,
                        grade_ids: [Number(gradeId)],
                        school_id: Number(schoolId) || 0,
                        is_active: true,
                        category: course.category || '',
                    })
                );
            }
            for (const ws of selectedWorkshops) {
                promises.push(
                    createMapping({
                        type: subscriptionType === 'school' ? 'school' : 'subscription',
                        content_id: String(ws.id || ws.content_id),
                        content_type: 'workshop',
                        content_title: ws.title || ws.content_title,
                        subscription_type: subscriptionType,
                        grade_ids: [Number(gradeId)],
                        school_id: Number(schoolId) || 0,
                        is_active: true,
                        category: ws.category || '',
                    })
                );
            }
            await Promise.all(promises);
            setMappingApplied(true);
            showToast('Mappings applied successfully! Click Save to finish.', 'success');
        } catch (err) {
            console.error('Failed to apply mappings:', err);
            showToast('Error applying mappings. Please try again.', 'error');
        } finally {
            setApplyingMappings(false);
        }
    };

    /* ── Step 2 — Cancel / Save ── */
    const handleCancel = () => navigate('/admin/config/users');

    const handleSave = () => {
        showToast('User saved successfully!', 'success');
        setTimeout(() => {
            navigate('/admin/config/users');
        }, 3000);
    };

    /* ── Helpers ── */
    const gradeName = grades.find(g => Number(g.id) === Number(gradeId))?.grade_name || grades.find(g => Number(g.id) === Number(gradeId))?.name || '';

    const filteredModalCourses = courses.filter(c =>
        (c.title || c.name || '').toLowerCase().includes(courseSearch.toLowerCase())
    );
    const filteredModalWorkshops = workshops.filter(w =>
        (w.title || w.name || '').toLowerCase().includes(workshopSearch.toLowerCase())
    );

    return (
        <Layout title="Create User">
            <div className="cu-page-wrapper">
                <div className="cu-container">
                    {step === 1 ? (
                        <>
                            {/* ── Step 1: breadcrumb ── */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>
                                <ChevronLeft size={18} color="#6b7280" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/config/users')} />
                                <span onClick={() => navigate('/admin/config/users')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>Users</span>
                                <span style={{ color: '#6b7280' }}>/</span>
                                <span style={{ color: '#6b7280' }}>New user</span>
                            </div>
                            {/* ── Step 1: stepper + Reset/Next ── */}
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
                                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'none' }}>
                                    <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '15px' }}>Student Details</span>
                                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>→</span>
                                    <span style={{ color: '#9ca3af', fontWeight: '500', fontSize: '15px' }}>Map &amp; Publish</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', zIndex: 1 }}>
                                    <button className="cu-btn-outline" onClick={handleReset}>Reset</button>
                                    <button className="cu-btn-primary" onClick={handleNext} disabled={saving}>
                                        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Next'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ── Step 2 Row 1: breadcrumb left, Save button right ── */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                                    <ChevronLeft size={18} color="#6b7280" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/config/users')} />
                                    <span onClick={() => navigate('/admin/config/users')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>Users</span>
                                    <span style={{ color: '#6b7280' }}>/</span>
                                    <span style={{ color: '#6b7280' }}>New user</span>
                                </div>
                                <button onClick={handleSave} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                    Save
                                </button>
                            </div>
                            {/* ── Step 2 Row 2: stepper CENTERED, Cancel + Apply Mappings RIGHT ── */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'none' }}>
                                    <span style={{ color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>Student Details</span>
                                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>→</span>
                                    <span style={{ color: '#2563eb', fontSize: '15px', fontWeight: '700' }}>Map &amp; Publish</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', zIndex: 1 }}>
                                    <button onClick={handleCancel} style={{ background: 'white', border: '1px solid #d1d5db', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApplyMappings}
                                        disabled={applyingMappings || (selectedCourses.length === 0 && selectedWorkshops.length === 0)}
                                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '600', cursor: (applyingMappings || (selectedCourses.length === 0 && selectedWorkshops.length === 0)) ? 'not-allowed' : 'pointer', opacity: (applyingMappings || (selectedCourses.length === 0 && selectedWorkshops.length === 0)) ? 0.6 : 1, fontSize: '14px' }}
                                    >
                                        {applyingMappings ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Apply Mappings'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="cu-form-body">
                        {/* ============== STEP 1 ============== */}
                        {step === 1 && (
                            <div className="cu-form-grid">
                                {/* ── LEFT COLUMN ── */}
                                <div className="cu-form-col">
                                    {/* 3-column name row */}
                                    <div className="cu-name-row" style={{ marginBottom: 20 }}>
                                        <div>
                                            <label className="cu-label">Surname*</label>
                                            <input className={`cu-input ${errors.surname ? 'cu-input-err' : ''}`} value={surname} onChange={e => setSurname(e.target.value)} />
                                            {errors.surname && <span className="cu-err">{errors.surname}</span>}
                                        </div>
                                        <div>
                                            <label className="cu-label">First Name*</label>
                                            <input className={`cu-input ${errors.firstName ? 'cu-input-err' : ''}`} value={firstName} onChange={e => setFirstName(e.target.value)} />
                                            {errors.firstName && <span className="cu-err">{errors.firstName}</span>}
                                        </div>
                                        <div>
                                            <label className="cu-label">Last Name*</label>
                                            <input className={`cu-input ${errors.lastName ? 'cu-input-err' : ''}`} value={lastName} onChange={e => setLastName(e.target.value)} />
                                            {errors.lastName && <span className="cu-err">{errors.lastName}</span>}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Mobile*</label>
                                        <input
                                            className={`cu-input ${errors.mobile ? 'cu-input-err' : ''}`}
                                            value={mobile}
                                            onChange={e => { setMobile(e.target.value); setErrors(prev => ({ ...prev, mobile: '' })); }}
                                        />
                                        {errors.mobile && <span className="cu-err">{errors.mobile}</span>}
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Email*</label>
                                        <input className={`cu-input ${errors.email ? 'cu-input-err' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                        {errors.email && <span className="cu-err">{errors.email}</span>}
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Subscription Type*</label>
                                        <select className={`cu-select ${errors.subscriptionType ? 'cu-input-err' : ''}`} value={subscriptionType} onChange={e => { setSubscriptionType(e.target.value); setSchoolId(''); setInstitution(''); }}>
                                            <option value="">Select...</option>
                                            <option value="premium">Premium</option>
                                            <option value="ultra">Ultra</option>
                                            <option value="school">School</option>
                                        </select>
                                        {errors.subscriptionType && <span className="cu-err">{errors.subscriptionType}</span>}
                                    </div>

                                    {(subscriptionType === 'premium' || subscriptionType === 'ultra') && (
                                        <div style={{ marginBottom: 20 }}>
                                            <label className="cu-label">Educational Institution (Optional)</label>
                                            <input className="cu-input" type="text" value={institution} onChange={e => setInstitution(e.target.value)} />
                                        </div>
                                    )}

                                    {subscriptionType === 'school' && (
                                        <div style={{ marginBottom: 20 }}>
                                            <label className="cu-label">Select School <span style={{ color: 'red' }}>*</span></label>
                                            <select className={`cu-select ${errors.schoolId ? 'cu-input-err' : ''}`} value={schoolId} onChange={e => setSchoolId(e.target.value)}>
                                                <option value="">Select school...</option>
                                                {schools.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {errors.schoolId && <span className="cu-err">{errors.schoolId}</span>}
                                        </div>
                                    )}

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Grade*</label>
                                        <select className={`cu-select ${errors.gradeId ? 'cu-input-err' : ''}`} value={gradeId} onChange={e => setGradeId(e.target.value)}>
                                            <option value="">Select</option>
                                            {grades.map(g => (
                                                <option key={g.id} value={g.id}>{g.grade_name || g.name}</option>
                                            ))}
                                        </select>
                                        {errors.gradeId && <span className="cu-err">{errors.gradeId}</span>}
                                    </div>
                                </div>

                                {/* ── RIGHT COLUMN (optional) ── */}
                                <div className="cu-form-col">
                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Parent Name</label>
                                        <input className="cu-input" value={parentName} onChange={e => setParentName(e.target.value)} />
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Address</label>
                                        <textarea className="cu-textarea" value={address} onChange={e => setAddress(e.target.value)} rows={3} />
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Profile Pic</label>
                                        <div style={{ position: 'relative', width: 140, height: 140 }}>
                                            <div
                                                onClick={() => !profilePicPreview && document.getElementById('profilePicInput').click()}
                                                style={{
                                                    width: 140,
                                                    height: 140,
                                                    border: '1px solid #d1d5db',
                                                    cursor: profilePicPreview ? 'default' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'white',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                }}
                                            >
                                                {profilePicPreview ? (
                                                    <>
                                                        <img
                                                            src={profilePicPreview}
                                                            alt="Profile"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0, left: 0, right: 0, bottom: 0,
                                                                background: 'rgba(0,0,0,0.5)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                opacity: 0,
                                                                transition: 'opacity 0.2s',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setProfilePicPreview(null);
                                                                    document.getElementById('profilePicInput').value = '';
                                                                }}
                                                                style={{
                                                                    background: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '6px 12px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                }}
                                                            >
                                                                🗑 Remove
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                                                        Click to upload
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            id="profilePicInput"
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                if (file.size > 1024 * 1024) {
                                                    showToast('Image must be less than 1MB', 'error');
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setProfilePicPreview(ev.target.result);
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* ============== STEP 2 ============== */}
                        {step === 2 && (
                            <>

                                {/* Student summary */}
                                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
                                    {/* Row 1: Name */}
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                                        {createdStudent?.name}
                                    </div>
                                    {/* Row 2: subscription badge + grade */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            background: (createdStudent?.subscription_type || '').toLowerCase() === 'ultra' ? '#fff7ed' : '#eff6ff',
                                            color: (createdStudent?.subscription_type || '').toLowerCase() === 'ultra' ? '#c2410c' : '#1d4ed8',
                                            border: `1px solid ${(createdStudent?.subscription_type || '').toLowerCase() === 'ultra' ? '#fed7aa' : '#bfdbfe'}`,
                                            padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'
                                        }}>
                                            {createdStudent?.subscription_type}
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                            {gradeName ? `Grade ${gradeName.replace(/grade\s*/i, '')}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {loadingAssets ? (
                                    <div className="cu-loading"><Loader2 size={28} className="animate-spin" /><span>Loading assets...</span></div>
                                ) : (
                                    <>
                                        {/* ── Assets Section (Step 2) ── */}
                                        <div className="asset-sections">
                                            {/* ── Courses Section ── */}
                                            <div className="asset-row open">
                                                <div className="row-header">
                                                    <div className="header-title">
                                                        <Layers size={18} className="icon" />
                                                        <span>Courses</span>
                                                        <span className="count-badge">{selectedCourses.length} Selected</span>
                                                    </div>
                                                    <div className="header-actions">
                                                        <button className="add-btn" onClick={() => handleOpenPicker('Courses')}>
                                                            <Plus size={14} /> Add
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="row-content">
                                                    {existingMappedCourses.length === 0 && selectedCourses.length === 0 ? (
                                                        <div className="empty-state">No courses selected yet. Click <strong>+ Add</strong> to select.</div>
                                                    ) : (
                                                        <div className="split-asset-tables">
                                                            {existingMappedCourses.length > 0 && (
                                                                <div className="asset-sub-section">
                                                                    <h5 className="sub-section-title">Already Mapped</h5>
                                                                    <table className="assets-table">
                                                                        <thead><tr><th>#</th><th>COURSE NAME</th><th>CATEGORY</th><th>MAPPED DATE</th></tr></thead>
                                                                        <tbody>
                                                                            {existingMappedCourses.map((c, i) => (
                                                                                <tr key={c.id}>
                                                                                    <td className="row-num">{i + 1}</td>
                                                                                    <td className="asset-name-cell">{c.title}</td>
                                                                                    <td><span className="type-badge">{c.category}</span></td>
                                                                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                                                                        {c.mappedAt ? new Date(c.mappedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                            {selectedCourses.length > 0 && (
                                                                <div className="asset-sub-section" style={{ marginTop: existingMappedCourses.length > 0 ? '24px' : '0' }}>
                                                                    <h5 className="sub-section-title">Newly Selected</h5>
                                                                    <table className="assets-table">
                                                                        <thead><tr><th>#</th><th>COURSE NAME</th><th>CATEGORY</th><th>MAPPED DATE</th><th>ACTIONS</th></tr></thead>
                                                                        <tbody>
                                                                            {selectedCourses.map((c, i) => (
                                                                                <tr key={c.id}>
                                                                                    <td className="row-num">{i + 1}</td>
                                                                                    <td className="asset-name-cell">{c.title || c.name}</td>
                                                                                    <td><span className="type-badge">{c.category || '—'}</span></td>
                                                                                    <td style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Pending</td>
                                                                                    <td>
                                                                                        <button className="remove-row-btn bin-btn" onClick={() => removeCourse(c.id)} title="Remove">
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
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Workshops Section ── */}
                                            <div className="asset-row open">
                                                <div className="row-header">
                                                    <div className="header-title">
                                                        <Layers size={18} className="icon" />
                                                        <span>Workshops</span>
                                                        <span className="count-badge">{selectedWorkshops.length} Selected</span>
                                                    </div>
                                                    <div className="header-actions">
                                                        <button className="add-btn" onClick={() => handleOpenPicker('Workshops')}>
                                                            <Plus size={14} /> Add
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="row-content">
                                                    {existingMappedWorkshops.length === 0 && selectedWorkshops.length === 0 ? (
                                                        <div className="empty-state">No workshops selected yet. Click <strong>+ Add</strong> to select.</div>
                                                    ) : (
                                                        <div className="split-asset-tables">
                                                            {existingMappedWorkshops.length > 0 && (
                                                                <div className="asset-sub-section">
                                                                    <h5 className="sub-section-title">Already Mapped</h5>
                                                                    <table className="assets-table">
                                                                        <thead><tr><th>#</th><th>WORKSHOP NAME</th><th>CATEGORY</th><th>MAPPED DATE</th></tr></thead>
                                                                        <tbody>
                                                                            {existingMappedWorkshops.map((w, i) => (
                                                                                <tr key={w.id}>
                                                                                    <td className="row-num">{i + 1}</td>
                                                                                    <td className="asset-name-cell">{w.title}</td>
                                                                                    <td><span className="type-badge">{w.category}</span></td>
                                                                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                                                                        {w.mappedAt ? new Date(w.mappedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                            {selectedWorkshops.length > 0 && (
                                                                <div className="asset-sub-section" style={{ marginTop: existingMappedWorkshops.length > 0 ? '24px' : '0' }}>
                                                                    <h5 className="sub-section-title">Newly Selected</h5>
                                                                    <table className="assets-table">
                                                                        <thead><tr><th>#</th><th>WORKSHOP NAME</th><th>CATEGORY</th><th>MAPPED DATE</th><th>ACTIONS</th></tr></thead>
                                                                        <tbody>
                                                                            {selectedWorkshops.map((w, i) => (
                                                                                <tr key={w.id}>
                                                                                    <td className="row-num">{i + 1}</td>
                                                                                    <td className="asset-name-cell">{w.title || w.name}</td>
                                                                                    <td><span className="type-badge">{w.category || '—'}</span></td>
                                                                                    <td style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Pending</td>
                                                                                    <td>
                                                                                        <button className="remove-row-btn bin-btn" onClick={() => removeWorkshop(w.id)} title="Remove">
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
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Asset Picker Modal */}
            <Modal
                isOpen={showAssetPicker}
                onClose={() => setShowAssetPicker(false)}
                title={`${pickerType} Mapping`}
            >
                <AssetPicker
                    type={pickerType}
                    onSelect={handleAssetToggle}
                    selectedIds={pickerType === 'Courses' ? selectedCourses.map(c => c.id) : selectedWorkshops.map(w => w.id)}
                    selectedFilters={{
                        userType: subscriptionType === 'ultra' ? 'Ultra' :
                            subscriptionType === 'premium' ? 'Premium' :
                                subscriptionType === 'school' ? 'School' : '',
                        gradeIds: gradeId ? [Number(gradeId)] : [],
                        schoolIds: subscriptionType === 'school' && schoolId ? [Number(schoolId)] : [],
                        assignmentMode: 'User'
                    }}
                    schools={schools}
                    grades={grades}
                />
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="cu-btn-secondary" onClick={() => setShowAssetPicker(false)}>Close</button>
                    <button className="cu-btn-primary" onClick={() => setShowAssetPicker(false)}>Save Selections</button>
                </div>
            </Modal>

            {/* ========== STYLES ========== */}
            <style dangerouslySetInnerHTML={{
                __html: `
        /* ── Page Wrapper & Container ── */
        .cu-page-wrapper {
          background-color: #f1f5f9;
          min-height: 100vh;
          padding: 0;
        }
        .cu-container {
          width: 100%;
          padding: 24px 48px;
          box-sizing: border-box;
        }

        /* ── Breadcrumb ── */
        .cu-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 20px; font-size: 14px; color: #6b7280;
        }
        .cu-breadcrumb-link {
          font-weight: 500; color: #2563eb; cursor: pointer;
          transition: color 0.15s; text-decoration: none;
        }
        .cu-breadcrumb-link:hover { color: #1d4ed8; text-decoration: underline; }
        .cu-breadcrumb-sep { color: #9ca3af; margin: 0 2px; }
        .cu-breadcrumb-current { color: #374151; font-weight: 500; }

        /* ── Stepper Row ── */
        .cu-stepper-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
          padding: 0;
        }
        .cu-stepper {
          display: flex; align-items: center; gap: 12px;
        }
        .cu-stepper-text {
          font-size: 15px; font-weight: 600; color: #9ca3af;
        }
        .cu-stepper-active { color: #2563eb; font-weight: 700; }
        .cu-stepper-done { color: #22c55e; }
        .cu-stepper-inactive { color: #9ca3af; }
        .cu-stepper-arrow { color: #9ca3af; font-size: 18px; font-weight: 300; }
        .cu-stepper-divider {
          border: none; border-top: 1px solid #e2e8f0; margin: 0 0 24px 0;
        }

        /* ── Form Body (no card) ── */
        .cu-form-body {
          background: transparent;
        }

        /* ── Header Actions ── */
        .cu-header-actions { display: flex; gap: 8px; }

        /* ── Buttons ── */
        .cu-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 24px; background: #2563eb; color: #ffffff;
          border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .cu-btn-primary:hover { background: #1d4ed8; }
        .cu-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cu-btn-outline {
          padding: 8px 16px; background: #ffffff; color: #374151;
          border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .cu-btn-outline:hover { background: #f9fafb; }

        /* ── Radio Buttons Pill Style ── */
        .cu-radio-group-simple { display: flex; gap: 20px; }
        .cu-radio-pill {
          display: inline-flex; align-items: center; gap: 8px;
          cursor: pointer; font-size: 14px; font-weight: 500; color: #374151;
          border: none; border-radius: 0; background: transparent; padding: 0;
        }
        .cu-radio-pill input[type="radio"] {
          width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer;
        }
        .cu-radio-pill:has(input:checked) {
          border: none; background: transparent;
        }

        /* ── Name Row (3-col equal) ── */
        .cu-name-row {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;
        }
        @media (max-width: 600px) {
          .cu-name-row { grid-template-columns: 1fr; }
        }

        /* ── Form Grid ── */
        .cu-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
          align-items: start;
        }
        @media (max-width: 800px) {
          .cu-form-grid { grid-template-columns: 1fr; }
        }
        .cu-form-col {
          display: flex; flex-direction: column;
        }
        .cu-col-label-optional {
          font-size: 11px; font-weight: 600; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        /* ── Labels ── */
        .cu-label {
          font-size: 14px; font-weight: 500; color: #374151;
          margin-bottom: 4px; display: block;
        }

        /* ── Inputs / Selects / Textarea ── */
        .cu-input, .cu-select, .cu-textarea {
          padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 4px;
          font-size: 14px; color: #111827; background: #fff; outline: none;
          width: 100%; box-sizing: border-box;
          box-shadow: none;
          transition: border-color 0.15s;
        }
        .cu-input:focus, .cu-select:focus, .cu-textarea:focus {
          border-color: #2563eb;
        }
        .cu-input-err { border-color: #ef4444 !important; }
        .cu-err { font-size: 12px; color: #ef4444; font-weight: 500; margin-top: 2px; }
        .cu-textarea { resize: vertical; min-height: 72px; }
        .cu-select { cursor: pointer; appearance: auto; }

        /* ── Profile Pic Box ── */
        .cu-upload-box-simple {
          width: 140px; height: 140px;
          border: 1px solid #d1d5db; border-radius: 4px;
          background: #ffffff;
        }

        /* ── Step 2: Student Card ── */
        .cu-student-card {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 16px 20px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 16px;
        }
        .cu-student-name { font-size: 16px; font-weight: 700; color: #1e293b; }
        .cu-student-meta { display: flex; align-items: center; gap: 10px; }
        .cu-student-grade { font-size: 13px; color: #64748b; font-weight: 500; }

        /* Badges (reuse UsersPage badge colors) */
        .up-badge {
          padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.02em;
        }
        .up-badge.ultra { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .up-badge.premium { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

        /* ── Map Section (Matching MappingControlPage) ── */
        .asset-sections { display: flex; flex-direction: column; gap: 12px; }
        .asset-row {
          background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          overflow: hidden; transition: all 0.2s;
        }
        .asset-row.open { border-color: #2563eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .row-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 24px; background: #f8fafc;
        }
        .header-title { display: flex; align-items: center; gap: 12px; }
        .header-title .icon { color: #2563eb; }
        .header-title span { font-weight: 700; color: #1e293b; font-size: 15px; }
        .count-badge {
          font-size: 11px; background: #eef2ff; color: #2563eb;
          padding: 2px 10px; border-radius: 12px; margin-left: 8px; font-weight: 600;
        }
        .add-btn {
          display: flex; align-items: center; gap: 6px;
          background: #dcfce7; color: #166534; padding: 6px 14px;
          border-radius: 6px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.2s;
        }
        .add-btn:hover { background: #bbf7d0; transform: scale(1.02); }
        .row-content { padding: 20px 24px; border-top: 1px solid #f1f5f9; }
        .sub-section-title {
          font-size: 13px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .sub-section-title::after {
          content: ""; flex: 1; height: 1px; background: #e2e8f0;
        }
        .empty-state {
          padding: 32px; text-align: center; color: #94a3b8; font-size: 14px;
          border: 2px dashed #e2e8f0; border-radius: 6px;
        }
        .assets-table { width: 100%; border-collapse: collapse; }
        .assets-table th {
          padding: 10px 14px; text-align: left; font-weight: 600; color: #64748b;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9;
        }
        .assets-table td { padding: 12px 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .row-num { color: #94a3b8; font-weight: 500; width: 30px; }
        .type-badge {
          background: #f1f5f9; color: #475569; padding: 2px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 600;
        }
        .remove-row-btn {
          background: #fef2f2; color: #ef4444; border: none;
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .remove-row-btn:hover { background: #fee2e2; transform: scale(1.1); }

        /* ── Loading ── */
        .cu-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 0; color: #94a3b8;
        }
        .sub-section-title {
          font-size: 13px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .sub-section-title::after {
          content: ""; flex: 1; height: 1px; background: #e2e8f0;
        }

        /* ── Picker Modal ── */
        .cu-picker { display: flex; flex-direction: column; gap: 12px; }
        .cu-picker-search {
          position: relative;
        }
        .cu-picker-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;
        }
        .cu-picker-search input {
          width: 100%; padding: 9px 14px 9px 36px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 14px; outline: none; background: #fff;
          transition: border-color 0.15s; box-sizing: border-box;
        }
        .cu-picker-search input:focus { border-color: #3b5bdb; }
        .cu-picker-list {
          max-height: 320px; overflow-y: auto;
          border: 1px solid #e2e8f0; border-radius: 8px;
        }
        .cu-picker-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; cursor: pointer;
          border-bottom: 1px solid #f8fafc; transition: background 0.1s;
        }
        .cu-picker-item:hover { background: #f8fafc; }
        .cu-picker-item-on { background: #eef2ff; }
        .cu-picker-item input[type="checkbox"] { accent-color: #3b5bdb; width: 16px; height: 16px; flex-shrink: 0; }
        .cu-picker-item-info { display: flex; flex-direction: column; gap: 2px; }
        .cu-picker-item-name { font-size: 14px; font-weight: 500; color: #1e293b; }
        .cu-picker-item-cat { font-size: 12px; color: #94a3b8; }
        .cu-picker-empty { padding: 30px; text-align: center; color: #94a3b8; font-size: 14px; }
        .cu-picker-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 8px; border-top: 1px solid #f1f5f9;
          font-size: 13px; color: #64748b; font-weight: 500;
        }
      `}} />
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
                    color: toast.type === 'success' ? '#166534' : '#991b1b',
                    padding: '12px 24px', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', color: 'inherit' }}>✕</button>
                </div>
            )}
        </Layout>
    );
};

export default CreateUserPage;
