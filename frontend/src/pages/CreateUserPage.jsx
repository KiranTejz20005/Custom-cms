import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Plus, Trash2, Upload, Search, Check } from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import { getGrades, getSchools, getCourses, getWorkshops, createStudent } from '../services/api';

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
    const [startDate, setStartDate] = useState('');
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

    // Fetch courses & workshops when entering step 2
    useEffect(() => {
        if (step !== 2) return;
        const fetchAssets = async () => {
            setLoadingAssets(true);
            try {
                const [cRes, wRes] = await Promise.all([getCourses(), getWorkshops()]);
                const extract = (r) => Array.isArray(r) ? r : (r?.items || r?.data || r?.results || []);
                setCourses(extract(cRes));
                setWorkshops(extract(wRes));
            } catch (e) { console.error('Failed loading assets', e); }
            finally { setLoadingAssets(false); }
        };
        fetchAssets();
    }, [step]);

    /* ── Step 1 Validation ── */
    const validate = () => {
        const errs = {};
        if (!firstName.trim()) errs.firstName = 'First Name is required';
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
            const fullName = [surname, firstName, lastName].filter(Boolean).join(' ').trim();
            const body = {
                name: fullName,
                email: email.trim(),
                password: 'Test@1234',
                grade: Number(gradeId),
                school: Number(schoolId) || 0,
                subscription_type: subscriptionType.toLowerCase(),
                start_date: startDate || null,
                mobile: mobile,
                parent_name: parentName.trim(),
                address: address.trim(),
            };

            const res = await createStudent(body);
            const studentId = res?.id || res?.data?.id || res?.user_id;
            setCreatedStudent({
                id: studentId,
                name: fullName,
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
        setStartDate(''); setGradeId(''); setParentName('');
        setAddress(''); setSchoolId(''); setInstitution('');
        setErrors({});
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
                    fetch(
                        `${import.meta.env.VITE_XANO_COURSES_BASE_URL}/upsert_entitlement`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: subscriptionType === 'school' ? 'school' : 'subscription',
                                content_id: course.id || course.content_id,
                                content_type: 'course',
                                content_title: course.title || course.content_title,
                                subscription_type: subscriptionType,
                                grade_ids: [Number(gradeId)],
                                school: Number(schoolId) || 0,
                                is_active: true,
                                category: course.category || '',
                            }),
                        }
                    )
                );
            }
            for (const ws of selectedWorkshops) {
                promises.push(
                    fetch(
                        `${import.meta.env.VITE_XANO_COURSES_BASE_URL}/upsert_entitlement`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: subscriptionType === 'school' ? 'school' : 'subscription',
                                content_id: ws.id || ws.content_id,
                                content_type: 'workshop',
                                content_title: ws.title || ws.content_title,
                                subscription_type: subscriptionType,
                                grade_ids: [Number(gradeId)],
                                school: Number(schoolId) || 0,
                                is_active: true,
                                category: ws.category || '',
                            }),
                        }
                    )
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '16px' }}>Student Details</span>
                                    <span style={{ color: '#9ca3af', fontSize: '20px' }}>→</span>
                                    <span style={{ color: '#9ca3af', fontWeight: '400', fontSize: '16px' }}>Map &amp; Publish</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
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
                                            <label className="cu-label">Surname</label>
                                            <input className="cu-input" value={surname} onChange={e => setSurname(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="cu-label">First Name*</label>
                                            <input className={`cu-input ${errors.firstName ? 'cu-input-err' : ''}`} value={firstName} onChange={e => setFirstName(e.target.value)} />
                                            {errors.firstName && <span className="cu-err">{errors.firstName}</span>}
                                        </div>
                                        <div>
                                            <label className="cu-label">Last Name</label>
                                            <input className="cu-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="cu-label">Mobile*</label>
                                        <input className="cu-input" value={mobile} onChange={e => setMobile(e.target.value)} />
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
                                        <label className="cu-label">Start Date*</label>
                                        <input className="cu-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>

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
                                <div className="cu-student-card">
                                    <div className="cu-student-name">{createdStudent?.name}</div>
                                    <div className="cu-student-meta">
                                        <span className={`up-badge ${(createdStudent?.subscription_type || '').toLowerCase()}`}>
                                            {(createdStudent?.subscription_type || '').toUpperCase()}
                                        </span>
                                        <span className="cu-student-grade">{gradeName ? `Grade ${gradeName.replace(/grade\s*/i, '')}` : ''}</span>
                                    </div>
                                </div>

                                {loadingAssets ? (
                                    <div className="cu-loading"><Loader2 size={28} className="animate-spin" /><span>Loading assets...</span></div>
                                ) : (
                                    <>
                                        {/* ── Courses Section ── */}
                                        <div className="cu-map-section">
                                            <div className="cu-map-header">
                                                <span className="cu-map-title">Courses</span>
                                                <span className="cu-map-count">{selectedCourses.length} Mapped</span>
                                                <button className="cu-btn-add" onClick={() => { setCourseSearch(''); setShowCourseModal(true); }}>
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                            {selectedCourses.length === 0 ? (
                                                <div className="cu-map-empty">No courses selected yet. Click <strong>+ Add</strong> to select.</div>
                                            ) : (
                                                <table className="cu-map-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th><th>NAME</th><th>CATEGORY</th><th>MAPPED DATE</th><th>ACTIONS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedCourses.map((c, i) => (
                                                            <tr key={c.id}>
                                                                <td>{i + 1}</td>
                                                                <td>{c.title || c.name}</td>
                                                                <td>{c.category || '—'}</td>
                                                                <td>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                                <td><button className="cu-del-btn" onClick={() => removeCourse(c.id)}><Trash2 size={14} /></button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>

                                        {/* ── Workshops Section ── */}
                                        <div className="cu-map-section">
                                            <div className="cu-map-header">
                                                <span className="cu-map-title">Workshops</span>
                                                <span className="cu-map-count">{selectedWorkshops.length} Mapped</span>
                                                <button className="cu-btn-add" onClick={() => { setWorkshopSearch(''); setShowWorkshopModal(true); }}>
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                            {selectedWorkshops.length === 0 ? (
                                                <div className="cu-map-empty">No workshops selected yet. Click <strong>+ Add</strong> to select.</div>
                                            ) : (
                                                <table className="cu-map-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th><th>NAME</th><th>CATEGORY</th><th>MAPPED DATE</th><th>ACTIONS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedWorkshops.map((w, i) => (
                                                            <tr key={w.id}>
                                                                <td>{i + 1}</td>
                                                                <td>{w.title || w.name}</td>
                                                                <td>{w.category || '—'}</td>
                                                                <td>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                                <td><button className="cu-del-btn" onClick={() => removeWorkshop(w.id)}><Trash2 size={14} /></button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modals (Outside the grid) ── */}
            <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Select Courses">
                <div className="cu-picker">
                    <div className="cu-picker-search">
                        <Search size={16} className="cu-picker-search-icon" />
                        <input placeholder="Search courses..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                    </div>
                    <div className="cu-picker-list">
                        {filteredModalCourses.length === 0 ? (
                            <div className="cu-picker-empty">No courses found.</div>
                        ) : filteredModalCourses.map(c => {
                            const checked = selectedCourses.some(sc => sc.id === c.id);
                            return (
                                <label key={c.id} className={`cu-picker-item ${checked ? 'cu-picker-item-on' : ''}`}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleCourse(c)} />
                                    <div className="cu-picker-item-info">
                                        <span className="cu-picker-item-name">{c.title || c.name}</span>
                                        <span className="cu-picker-item-cat">{c.category || ''}</span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="cu-picker-footer">
                        <span>{selectedCourses.length} selected</span>
                        <button className="cu-btn-primary" onClick={() => setShowCourseModal(false)}>Done</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showWorkshopModal} onClose={() => setShowWorkshopModal(false)} title="Select Workshops">
                <div className="cu-picker">
                    <div className="cu-picker-search">
                        <Search size={16} className="cu-picker-search-icon" />
                        <input placeholder="Search workshops..." value={workshopSearch} onChange={e => setWorkshopSearch(e.target.value)} />
                    </div>
                    <div className="cu-picker-list">
                        {filteredModalWorkshops.length === 0 ? (
                            <div className="cu-picker-empty">No workshops found.</div>
                        ) : filteredModalWorkshops.map(w => {
                            const checked = selectedWorkshops.some(sw => sw.id === w.id);
                            return (
                                <label key={w.id} className={`cu-picker-item ${checked ? 'cu-picker-item-on' : ''}`}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleWorkshop(w)} />
                                    <div className="cu-picker-item-info">
                                        <span className="cu-picker-item-name">{w.title || w.name}</span>
                                        <span className="cu-picker-item-cat">{w.category || ''}</span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    <div className="cu-picker-footer">
                        <span>{selectedWorkshops.length} selected</span>
                        <button className="cu-btn-primary" onClick={() => setShowWorkshopModal(false)}>Done</button>
                    </div>
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

        /* ── Map Section ── */
        .cu-map-section {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          overflow: hidden; margin-bottom: 18px;
        }
        .cu-map-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .cu-map-title { font-size: 15px; font-weight: 700; color: #1e293b; }
        .cu-map-count {
          font-size: 12px; font-weight: 600; color: #3b5bdb;
          background: #eef2ff; padding: 3px 10px; border-radius: 999px;
        }
        .cu-btn-add {
          display: flex; align-items: center; gap: 4px;
          margin-left: auto; padding: 6px 14px;
          background: #eef2ff; color: #3b5bdb; border: 1px solid #c7d2fe;
          border-radius: 6px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.12s;
        }
        .cu-btn-add:hover { background: #3b5bdb; color: #fff; border-color: #3b5bdb; }
        .cu-map-empty {
          padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 14px;
        }
        .cu-map-table {
          width: 100%; border-collapse: collapse;
        }
        .cu-map-table th {
          background: #f8fafc; padding: 10px 16px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em; color: #64748b;
          border-bottom: 1px solid #e2e8f0; text-align: left;
        }
        .cu-map-table td {
          padding: 12px 16px; font-size: 14px; color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        .cu-del-btn {
          background: #fef2f2; color: #ef4444; border: none;
          width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.12s;
        }
        .cu-del-btn:hover { background: #ef4444; color: #fff; }

        /* ── Loading ── */
        .cu-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 0; color: #94a3b8;
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
