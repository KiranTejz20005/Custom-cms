import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Toast from '../components/common/Toast';
import { getUsers, getGrades, getSchools, updateStudent } from '../services/api';

const EditUserPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [grades, setGrades] = useState([]);
    const [schools, setSchools] = useState([]);

    // Original data for reset
    const [original, setOriginal] = useState(null);

    // Form fields
    const [userKind, setUserKind] = useState('user');
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
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => setToast({ message: msg, type });

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            try {
                const [usersRes, gradesRes, schoolsRes] = await Promise.all([
                    getUsers(),
                    getGrades(),
                    getSchools(),
                ]);
                const allUsers = Array.isArray(usersRes) ? usersRes : (usersRes.data || []);
                const user = allUsers.find(u => String(u.id) === String(id));

                const gData = Array.isArray(gradesRes) ? gradesRes : (gradesRes.data || []);
                setGrades([...gData].sort((a, b) => Number(a.id) - Number(b.id)));
                setSchools(Array.isArray(schoolsRes) ? schoolsRes : (schoolsRes.data || []));

                if (user) {
                    const nameParts = (user.name || '').trim().split(' ');
                    const sn = nameParts.length > 2 ? nameParts[0] : '';
                    const fn = nameParts.length > 2 ? nameParts[1] : (nameParts[0] || '');
                    const ln = nameParts.length > 2 ? nameParts.slice(2).join(' ') : (nameParts[1] || '');
                    const hasSchool = Number(user.school || user.school_id || 0) !== 0;

                    const data = {
                        userKind: hasSchool ? 'school' : 'user',
                        surname: sn,
                        firstName: fn,
                        lastName: ln,
                        mobile: user.mobile || '',
                        email: user.email || '',
                        subscriptionType: user.subscription_type || '',
                        startDate: user.start_date ? user.start_date.split('T')[0] : '',
                        gradeId: String(user.grade || user.grade_id || ''),
                        parentName: user.parent_name || '',
                        address: user.address || '',
                        schoolId: String(user.school || user.school_id || ''),
                        institution: user.institution || '',
                    };
                    setOriginal(data);
                    populateFields(data);
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [id]);

    const populateFields = (data) => {
        setUserKind(data.userKind);
        setSurname(data.surname);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setMobile(data.mobile);
        setEmail(data.email);
        setSubscriptionType(data.subscriptionType);
        setStartDate(data.startDate);
        setGradeId(data.gradeId);
        setParentName(data.parentName);
        setAddress(data.address);
        setSchoolId(data.schoolId);
        setInstitution(data.institution);
    };

    const handleReset = () => {
        if (original) populateFields(original);
        setErrors({});
    };

    const validate = () => {
        const errs = {};
        if (!firstName.trim()) errs.firstName = 'First Name is required';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
        if (!subscriptionType) errs.subscriptionType = 'Subscription Type is required';
        if (!gradeId) errs.gradeId = 'Grade is required';
        if (userKind === 'school' && !schoolId) errs.schoolId = 'Please select a school';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const fullName = [surname, firstName, lastName].filter(Boolean).join(' ').trim();
            const body = {
                student_id: Number(id),
                name: fullName,
                email: email.trim(),
                grade: Number(gradeId),
                school: userKind === 'school' ? (Number(schoolId) || 0) : 0,
                subscription_type: subscriptionType.toLowerCase(),
                start_date: startDate || null,
            };
            if (mobile.trim()) body.mobile = mobile.trim();
            if (parentName.trim()) body.parent_name = parentName.trim();
            if (address.trim()) body.address = address.trim();

            await updateStudent(body);
            showToast('User updated successfully!');
            setTimeout(() => navigate('/admin/config/users'), 1500);
        } catch (err) {
            console.error('Failed to update student:', err);
            showToast(err?.message || 'Error updating user. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Edit User">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: 12, color: '#94a3b8' }}>
                    <Loader2 size={28} className="animate-spin" />
                    <span style={{ fontSize: 16 }}>Loading user data...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Edit User">
            <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
                <div style={{ width: '100%', padding: '24px 40px', boxSizing: 'border-box' }}>

                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>
                        <ChevronLeft
                            size={18}
                            color="#6b7280"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/admin/config/users')}
                        />
                        <span
                            onClick={() => navigate('/admin/config/users')}
                            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}
                        >
                            Users
                        </span>
                        <span style={{ color: '#6b7280' }}>/</span>
                        <span style={{ color: '#6b7280' }}>Edit User</span>
                    </div>

                    {/* Stepper row */}
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
                        <div style={{ flex: 1 }} />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '16px' }}>Edit Student Details</span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="cu-btn-outline" onClick={handleReset}>Reset</button>
                            <button className="cu-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '48px', alignItems: 'start' }}>

                        {/* LEFT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Radio row */}
                            <div style={{ marginBottom: 20, display: 'flex', gap: 20 }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151' }}>
                                    <input type="radio" name="userKind" value="user" checked={userKind === 'user'} onChange={() => setUserKind('user')} style={{ width: 15, height: 15, accentColor: '#2563eb' }} />
                                    User
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151' }}>
                                    <input type="radio" name="userKind" value="school" checked={userKind === 'school'} onChange={() => setUserKind('school')} style={{ width: 15, height: 15, accentColor: '#2563eb' }} />
                                    School
                                </label>
                            </div>

                            {/* Name row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={labelStyle}>Surname</label>
                                    <input className="cu-input" value={surname} onChange={e => setSurname(e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>First Name*</label>
                                    <input className={`cu-input${errors.firstName ? ' cu-input-err' : ''}`} value={firstName} onChange={e => setFirstName(e.target.value)} />
                                    {errors.firstName && <span style={errStyle}>{errors.firstName}</span>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Last Name</label>
                                    <input className="cu-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Mobile</label>
                                <input className="cu-input" value={mobile} onChange={e => setMobile(e.target.value)} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Email*</label>
                                <input className={`cu-input${errors.email ? ' cu-input-err' : ''}`} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                {errors.email && <span style={errStyle}>{errors.email}</span>}
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Subscription Type*</label>
                                <select className={`cu-select${errors.subscriptionType ? ' cu-input-err' : ''}`} value={subscriptionType} onChange={e => setSubscriptionType(e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="Premium">Premium</option>
                                    <option value="Ultra">Ultra</option>
                                </select>
                                {errors.subscriptionType && <span style={errStyle}>{errors.subscriptionType}</span>}
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Start Date</label>
                                <input className="cu-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Grade*</label>
                                <select className={`cu-select${errors.gradeId ? ' cu-input-err' : ''}`} value={gradeId} onChange={e => setGradeId(e.target.value)}>
                                    <option value="">Select</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.grade_name || g.name}</option>
                                    ))}
                                </select>
                                {errors.gradeId && <span style={errStyle}>{errors.gradeId}</span>}
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Parent Name</label>
                                <input className="cu-input" value={parentName} onChange={e => setParentName(e.target.value)} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Address</label>
                                <textarea className="cu-textarea" value={address} onChange={e => setAddress(e.target.value)} rows={3} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                {userKind === 'user' ? (
                                    <>
                                        <label style={labelStyle}>Educational Institution (Optional)</label>
                                        <input className="cu-input" type="text" value={institution} onChange={e => setInstitution(e.target.value)} />
                                    </>
                                ) : (
                                    <>
                                        <label style={labelStyle}>School <span style={{ color: 'red' }}>*</span></label>
                                        <select className={`cu-select${errors.schoolId ? ' cu-input-err' : ''}`} value={schoolId} onChange={e => setSchoolId(e.target.value)}>
                                            <option value="">Select school...</option>
                                            {schools.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        {errors.schoolId && <span style={errStyle}>{errors.schoolId}</span>}
                                    </>
                                )}
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Profile Pic</label>
                                <div style={{ position: 'relative', width: 140, height: 140 }}>
                                    <div
                                        onClick={() => !profilePicPreview && document.getElementById('editProfilePicInput').click()}
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
                                                        onClick={(e) => { e.stopPropagation(); setProfilePicPreview(null); document.getElementById('editProfilePicInput').value = ''; }}
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
                                    id="editProfilePicInput"
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

            <style dangerouslySetInnerHTML={{
                __html: `
        .cu-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 24px; background: #2563eb; color: #ffffff;
          border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
          cursor: pointer;
        }
        .cu-btn-primary:hover { background: #1d4ed8; }
        .cu-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cu-btn-outline {
          padding: 8px 16px; background: #ffffff; color: #374151;
          border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .cu-btn-outline:hover { background: #f9fafb; }
        .cu-input, .cu-select, .cu-textarea {
          padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 4px;
          font-size: 13px; color: #111827; background: #fff; outline: none;
          width: 100%; box-sizing: border-box; box-shadow: none;
        }
        .cu-input:focus, .cu-select:focus, .cu-textarea:focus { border-color: #2563eb; }
        .cu-input-err { border-color: #ef4444 !important; }
        .cu-textarea { resize: vertical; min-height: 72px; }
        .cu-select { cursor: pointer; }
      `}} />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </Layout>
    );
};

const labelStyle = {
    fontSize: '13px', fontWeight: '500', color: '#374151',
    marginBottom: '4px', display: 'block',
};
const errStyle = {
    fontSize: '12px', color: '#ef4444', fontWeight: '500', marginTop: '2px', display: 'block',
};

export default EditUserPage;
