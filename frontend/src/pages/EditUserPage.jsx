import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Plus, Trash2, Upload, Search, Check } from 'lucide-react';
import Layout from '../components/common/Layout';
import { getUsers, getGrades, getSchools, updateStudent } from '../services/api';

const EditUserPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Meta
    const [grades, setGrades] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form fields
    const [surname, setSurname] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [subscriptionType, setSubscriptionType] = useState('');
    const [gradeId, setGradeId] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [parentName, setParentName] = useState('');
    const [address, setAddress] = useState('');
    const [institution, setInstitution] = useState('');
    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [errors, setErrors] = useState({});

    // Original data for reset
    const [originalData, setOriginalData] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [gRes, sRes] = await Promise.all([getGrades(), getSchools()]);
                const gData = Array.isArray(gRes) ? gRes : (gRes.data || []);
                setGrades([...gData].sort((a, b) => Number(a.id) - Number(b.id)));
                setSchools(Array.isArray(sRes) ? sRes : (sRes.data || []));
            } catch (e) {
                console.error('Failed loading meta', e);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadStudent = async () => {
            if (!id) return;
            setLoading(true);
            try {
                console.log('Loading student with id:', id);
                const allUsers = await getUsers();
                console.log('All users response:', allUsers);

                const users = Array.isArray(allUsers) ? allUsers :
                    (allUsers?.data || allUsers?.items || allUsers?.result || []);
                console.log('Users array:', users);
                console.log('Users count:', users.length);

                const student = users.find(u => String(u.id) === String(id));
                console.log('Found student:', student);

                if (!student) {
                    console.log('Student NOT found for id:', id);
                    setLoading(false);
                    return;
                }

                setOriginalData(student);

                setSurname(student.surname_ || '');
                setFirstName(student.first_name_ || '');
                setLastName(student.last_name_ || '');

                setMobile(student.mobile_ || '');
                setEmail(student.email || '');
                setSubscriptionType(student.subscription_type || '');
                setGradeId(String(student.grade || ''));
                setSchoolId(String(student.school || ''));
                setParentName(student.parent_name || '');
                setAddress(student.address || '');
                setInstitution(student.institution || '');
                if (student.profile_pic) setProfilePicPreview(student.profile_pic.url || student.profile_pic);
            } catch (e) {
                console.error('Failed to load student:', e);
            } finally {
                setLoading(false);
            }
        };
        loadStudent();
    }, [id]);

    const handleReset = () => {
        if (originalData) {
            const student = originalData;
            setFirstName(student.name || '');
            setSurname('');
            setLastName('');
            setMobile(student.mobile_ || student.mobile || '');
            setEmail(student.email || '');
            setSubscriptionType(student.subscription_type || '');
            setGradeId(String(student.grade || student.grade_level || ''));
            setSchoolId(String(student.school || student.school_id || ''));
            setParentName(student.parent_name || '');
            setAddress(student.address || '');
            setInstitution(student.institution || '');
            setProfilePicPreview(student.profile_pic?.url || student.profile_pic || null);
        }
        setErrors({});
    };

    const validate = () => {
        const errs = {};
        if (!firstName.trim()) errs.firstName = 'First Name is required';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
        if (!subscriptionType) errs.subscriptionType = 'Subscription Type is required';
        if (!gradeId) errs.gradeId = 'Grade is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const body = {
                student_id: Number(id),
                first_name_: firstName.trim(),
                last_name_: lastName.trim() || '',
                surname_: surname.trim() || '',
                email: email.trim(),
                grade: Number(gradeId),
                school: Number(schoolId) || 0,
                subscription_type: subscriptionType.toLowerCase(),
                mobile: mobile,
                mobile_: mobile,
                parent_name: parentName.trim(),
                address: address.trim()
            };

            const res = await updateStudent(body);

            showToast('User updated successfully!', 'success');
            setTimeout(() => navigate('/admin/config/users'), 2000);
        } catch (error) {
            showToast(error?.message || 'Failed to update user', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb' }} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="cu-page-wrapper">
                <div className="cu-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
                            <ChevronLeft size={18} color="#6b7280" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/config/users')} />
                            <span onClick={() => navigate('/admin/config/users')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>Users</span>
                            <span style={{ color: '#6b7280' }}>/</span>
                            <span style={{ color: '#6b7280' }}>Edit User</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="cu-btn-outline" onClick={handleReset}>Reset</button>
                            <button className="cu-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'center', marginBottom: '32px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Edit User</h2>
                    </div>

                    <div className="cu-form-body">
                        <div className="cu-form-grid">
                            <div className="cu-form-col">
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
                                        <input className="cu-input" value={institution}
                                            onChange={e => setInstitution(e.target.value)} />
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
                                            <option key={g.id} value={String(g.id)}>{g.grade_name || g.name}</option>
                                        ))}
                                    </select>
                                    {errors.gradeId && <span className="cu-err">{errors.gradeId}</span>}
                                </div>
                            </div>

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
                                                width: 140, height: 140,
                                                border: '1px solid #d1d5db',
                                                cursor: profilePicPreview ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: 'white', overflow: 'hidden', position: 'relative',
                                            }}
                                        >
                                            {profilePicPreview ? (
                                                <>
                                                    <img src={profilePicPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div
                                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                    >
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setProfilePicPreview(null); document.getElementById('profilePicInput').value = ''; }}
                                                            style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                                                        >🗑 Remove</button>
                                                    </div>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>Click to upload</span>
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
                                            if (file.size > 1024 * 1024) { showToast('Image must be less than 1MB', 'error'); return; }
                                            const reader = new FileReader();
                                            reader.onload = (ev) => setProfilePicPreview(ev.target.result);
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .cu-page-wrapper {
          background-color: transparent;
          min-height: 100vh;
          padding: 0;
        }
        .cu-container {
          width: 100%;
          padding: 24px 48px;
          box-sizing: border-box;
        }
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
        .cu-form-body { background: transparent; }
        .cu-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
          align-items: start;
        }
        @media (max-width: 800px) {
          .cu-form-grid { grid-template-columns: 1fr; }
        }
        .cu-form-col { display: flex; flex-direction: column; }
        .cu-name-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .cu-label { font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px; display: block; }
        .cu-input, .cu-select, .cu-textarea {
          padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 4px;
          font-size: 14px; color: #111827; background: #fff; outline: none;
          width: 100%; box-sizing: border-box; transition: border-color 0.15s;
        }
        .cu-input:focus, .cu-select:focus, .cu-textarea:focus { border-color: #2563eb; }
        .cu-input-err { border-color: #ef4444 !important; }
        .cu-err { font-size: 12px; color: #ef4444; font-weight: 500; margin-top: 2px; }
        .cu-textarea { resize: vertical; min-height: 72px; }
        .cu-select { cursor: pointer; appearance: auto; }
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

export default EditUserPage;
