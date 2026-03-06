import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import JoditEditor from 'jodit-react';
import {
    ChevronRight, ChevronLeft, Image as ImageIcon, Video, HelpCircle,
    ChevronDown, ChevronUp, Upload, Link as LinkIcon, X, GripVertical,
    FileText, MoreVertical, Trash2, Plus, Layout as LayoutIcon, Rocket,
    Paperclip, Youtube
} from 'lucide-react';
import {
    getCategories, getCourses, createCourse, addChapter, createQuiz,
    updateCourseVisibility, publishCourse, getSchools, getGrades, getMappings,
    updateChapter, updateQuiz, deleteChapter, deleteQuiz, updateChapterOrder
} from '../services/api';
import toast from 'react-hot-toast';

const NewCoursePage = () => {
    const navigate = useNavigate();
    const [courseName, setCourseName] = useState('');
    const [headerImage, setHeaderImage] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [selectedInstructors, setSelectedInstructors] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [allCourses, setAllCourses] = useState([]); // List for Map & Publish tabs
    const [activeTab, setActiveTab] = useState('unmapped'); // unmapped | mapped
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [instructorsList] = useState([
        { id: 1, name: 'Jasmine Ahuja Kher', avatar: 'https://i.pravatar.cc/150?u=jasmine' },
        { id: 2, name: 'John Peter Long name..', avatar: 'https://i.pravatar.cc/150?u=john' }
    ]);
    const [showURLInput, setShowURLInput] = useState({ header: false, thumbnail: false });
    const [tempURL, setTempURL] = useState({ header: '', thumbnail: '' });

    const headerFileRef = useRef(null);
    const thumbnailFileRef = useRef(null);
    const attachmentFileRef = useRef(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'attachment') {
                setAttachments(prev => [...prev, { name: file.name, size: file.size }]);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'header') setHeaderImage(reader.result);
                else setThumbnail(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleURLSubmit = (type) => {
        if (type === 'header') setHeaderImage(tempURL.header);
        else setThumbnail(tempURL.thumbnail);
        setShowURLInput(prev => ({ ...prev, [type]: false }));
    };
    const [step, setStep] = useState(1);
    const [content, setContent] = useState('Simple and lightweight <span style="color: #2563eb">React</span> WYSIWYG editor.');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 2: Chapters State
    const [items, setItems] = useState([]);
    const [activeItem, setActiveItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

    // Step 3: Mapping State
    const [mappingType, setMappingType] = useState('both');
    const [selectedUserTypes, setSelectedUserTypes] = useState([]);
    const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
    const [selectedGradeId, setSelectedGradeId] = useState('');
    const [schoolSearch, setSchoolSearch] = useState('');
    const [schools, setSchools] = useState([]);
    const [grades, setGrades] = useState([]);
    const [mappings, setMappings] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [catsRes, coursesRes, schoolsRes, gradesRes, mappingsRes] = await Promise.all([
                    getCategories(),
                    getCourses(),
                    getSchools(),
                    getGrades(),
                    getMappings()
                ]);

                setMappings(mappingsRes.data || mappingsRes.items || (Array.isArray(mappingsRes) ? mappingsRes : []));

                // Get categories from dedicated endpoint
                const rawCats = catsRes.data || catsRes.items || (Array.isArray(catsRes) ? catsRes : []);
                const catsFromEndpoint = rawCats.map(c => {
                    if (typeof c === 'string') return c;
                    return c.category_name || c.name || c.title || c.label;
                }).filter(Boolean);

                // Extract unique categories from existing courses
                const coursesData = coursesRes.data || coursesRes.items || (Array.isArray(coursesRes) ? coursesRes : []);
                const catsFromCourses = coursesData.map(c => c.category).filter(Boolean);

                // Merge and deduplicate
                const allUniqueCats = [...new Set([...catsFromEndpoint, ...catsFromCourses])].sort();
                setCategories(allUniqueCats);

                setSchools(schoolsRes.data || schoolsRes.items || (Array.isArray(schoolsRes) ? schoolsRes : []));
                setGrades(gradesRes.data || gradesRes.items || (Array.isArray(gradesRes) ? gradesRes : []));
                setAllCourses(coursesData); // Set allCourses from the fetched coursesRes
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const editorConfig = {
        readonly: false,
        placeholder: 'Start typing...',
        height: 600,
        width: '100%',
        toolbarSticky: false,
        buttons: [
            'undo', 'redo', '|', 'bold', 'italic', 'underline', '|',
            'ul', 'ol', '|', 'link', 'video', 'source', '|', 'eraser', 'fullsize'
        ],
        uploader: {
            insertImageAsBase64URI: true
        }
    };

    const handleAddItem = async (type) => {
        if (!currentCourseId) {
            toast.error("Please save course details first.");
            return;
        }

        try {
            let newItemId;
            if (type === 'chapter' || type === 'challenge' || type === 'goal') {
                const res = await addChapter({
                    course_id: Number(currentCourseId),
                    title: `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    type: type,
                    body_content: '',
                    parent_id: null,
                    youtube_url: ''
                });
                console.log(`addChapter (${type}) full response:`, JSON.stringify(res));
                newItemId = res?.id || res?.course_id || res?.chapter_id;
                console.log(`Chapter newItemId:`, newItemId);
            } else if (type === 'quiz') {
                const res = await createQuiz({
                    course_id: Number(currentCourseId),
                    chapter_id: null,
                    title: 'Untitled Quiz',
                    sequence_order: 0,
                    questions: []
                });
                console.log("createQuiz full response:", JSON.stringify(res));
                newItemId = res?.quiz?.id || res?.id || res?.quiz_id;
                console.log("Quiz newItemId:", newItemId);
            }

            const newItem = {
                id: newItemId || Date.now(),
                type,
                title: `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                content: '',
                questions: type === 'quiz' ? [{
                    id: Date.now(), question: '', a: '', b: '', c: '', d: '',
                    correct_answer: 'a', marks: 1
                }] : []
            };
            setItems([...items, newItem]);
            setActiveItem(newItem);
            toast.success(`${type} added successfully.`);
        } catch (err) {
            console.error(`Failed to add ${type}:`, err);
            const errorMsg = err.message || `Failed to add ${type}.`;
            toast.error(errorMsg);
        }
    };

    const addQuestion = () => {
        if (activeItem?.type !== 'quiz') return;
        const newQs = [...(activeItem.questions || []), {
            id: Date.now(), question: '', a: '', b: '', c: '', d: '',
            correct_answer: 'a', marks: 1
        }];
        updateActiveItem({ questions: newQs });
    };

    const deleteQuestion = (qId) => {
        const newQs = activeItem.questions.filter(q => q.id !== qId);
        updateActiveItem({ questions: newQs });
    };

    const updateQuestion = (qId, field, value) => {
        const newQs = activeItem.questions.map(q => q.id === qId ? { ...q, [field]: value } : q);
        updateActiveItem({ questions: newQs });
    };

    const deleteItem = (id) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);
        if (activeItem?.id === id) setActiveItem(null);
    };

    const updateActiveItem = (updates) => {
        if (!activeItem) return;
        const updated = { ...activeItem, ...updates };
        setActiveItem(updated);
        setItems(items.map(item => item.id === activeItem.id ? updated : item));
    };

    const handleSaveQuiz = async () => {
        if (!activeItem || activeItem.type !== 'quiz') return;
        try {
            setLoading(true);
            await updateQuiz(activeItem.id, {
                title: activeItem.title,
                questions: activeItem.questions
            });
            toast.success("Quiz saved successfully.");
        } catch (err) {
            console.error("Save quiz failed:", err);
            toast.error("Failed to save quiz.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChapter = async () => {
        if (!activeItem || (activeItem.type !== 'chapter' && activeItem.type !== 'challenge' && activeItem.type !== 'goal')) return;
        console.log("Saving chapter ID:", activeItem.id, "type:", typeof activeItem.id);
        try {
            setLoading(true);
            await updateChapter(activeItem.id, {
                title: activeItem.title,
                body_content: activeItem.content,
                youtube_url: activeItem.youtube_url
            });
            toast.success("Chapter saved successfully.");
        } catch (err) {
            console.error("Save chapter failed:", err);
            toast.error("Failed to save chapter.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (e, id, type) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            if (type === 'quiz') await deleteQuiz(id);
            else await deleteChapter(id);

            const newItems = items.filter(item => item.id !== id);
            setItems(newItems);
            if (activeItem?.id === id) setActiveItem(null);
            toast.success(`${type} deleted.`);
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete item.");
        }
    };

    const handleMoveItem = async (e, filteredIndex, direction) => {
        e.stopPropagation();

        const filteredItems = items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const itemToMove = filteredItems[filteredIndex];
        const originalIndex = items.findIndex(item => item.id === itemToMove.id);

        const targetIndex = originalIndex + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const newItems = [...items];
        [newItems[originalIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[originalIndex]];
        setItems(newItems);

        try {
            await updateChapterOrder({
                course_id: currentCourseId,
                items: newItems.map((item, idx) => ({ id: item.id, sequence_order: idx }))
            });
        } catch (err) {
            console.error("Order update failed:", err);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!courseName) {
                toast.error("Course name is required.");
                return;
            }
            try {
                setLoading(true);
                const payload = {
                    title: courseName,
                    category: selectedCategory,
                    instructor: selectedInstructors.map(i => i.id), // Send array of IDs
                    description: courseDescription,
                    thumbnail_url: thumbnail,
                    header_image_url: headerImage,
                    body_content: content,
                    youtube_url: youtubeUrl,
                    attachments: attachments.map(a => ({ name: a.name })),
                    visibility_level: "public"
                };

                console.log("create_course payload:", JSON.stringify(payload));

                const res = await createCourse(payload);
                const newId = res?.id || res?.course_id;
                if (!newId) {
                    throw new Error("Course created but no ID returned from server.");
                }
                setCurrentCourseId(newId);
                setStep(2);
                toast.success("Course details saved.");
            } catch (err) {
                console.error("Failed to create course:", err);
                const errorMsg = err.message || "Failed to save course details.";
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        } else if (step === 2) {
            setStep(3);
        }
    };

    const handleUpdateVisibility = async () => {
        try {
            setLoading(true);
            await updateCourseVisibility({
                course_id: currentCourseId,
                visibility_level: "public",
                school_ids: selectedSchoolIds,
                grade_id: selectedGradeId,
                mapping_type: mappingType,
                tier: selectedUserTypes[0]?.toLowerCase() || null
            });
            toast.success("Visibility settings saved.");
        } catch (err) {
            console.error("Failed to update visibility:", err);
            toast.error("Failed to save visibility settings.");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            setLoading(true);
            await publishCourse({
                course_id: currentCourseId,
                visibility_level: "published"
            });
            toast.success("Course published successfully!");
            navigate('/admin/mappings/view');
        } catch (err) {
            console.error("Failed to publish course:", err);
            toast.error("Failed to publish course.");
        } finally {
            setLoading(false);
        }
    };

    const getFilteredCourses = () => {
        if (!allCourses || !mappings) return [];

        return allCourses.filter(course => {
            const courseMappings = mappings.filter(m => (m.content_id == course.id || m.content_id == course.course_id) && String(m.content_type).toLowerCase() === 'course');

            const isCurrentlyMapped = courseMappings.some(m => {
                // Grade match
                const mGrades = Array.isArray(m.grade_ids) ? m.grade_ids : (m.grade_id ? [m.grade_id] : []);
                const gradeMatch = !selectedGradeId || mGrades.includes(Number(selectedGradeId));

                if (!gradeMatch) return false;

                // Audience match
                if (mappingType === 'user') {
                    return selectedUserTypes.some(ut => (m.subscription_type || '').toLowerCase() === ut.toLowerCase());
                } else if (mappingType === 'school') {
                    return selectedSchoolIds.includes(Number(m.school_id));
                } else if (mappingType === 'both') {
                    const utMatch = selectedUserTypes.length === 0 || selectedUserTypes.some(ut => (m.subscription_type || '').toLowerCase() === ut.toLowerCase());
                    const schoolMatch = selectedSchoolIds.length === 0 || selectedSchoolIds.includes(Number(m.school_id));
                    return utMatch && schoolMatch;
                }
                return true;
            });

            return activeTab === 'mapped' ? isCurrentlyMapped : !isCurrentlyMapped;
        }).map(course => {
            // Find a mapping to show in table (prefer one that matches selection)
            const matchedMapping = mappings.find(m => (m.content_id == course.id || m.content_id == course.course_id) && String(m.content_type).toLowerCase() === 'course');
            const school = matchedMapping ? schools.find(s => s.id == matchedMapping.school_id) : null;

            return {
                ...course,
                displaySchoolId: matchedMapping?.school_id || '—',
                displayArea: school?.area || '—',
                displayCity: school?.city || '—'
            };
        });
    };

    const getYoutubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeVideoId(youtubeUrl);

    return (
        <Layout title="New Course">
            <div className="new-course-page animate-fade-in" style={{ paddingBottom: '40px' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(-1)}>
                            <ChevronLeft size={24} color="#64748b" />
                            <span style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>Courses / New Course</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Course name"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '15px',
                                width: '300px',
                                outline: 'none',
                                background: '#ffffff',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>
                    <button
                        onClick={step === 3 ? handlePublish : handleNext}
                        disabled={loading}
                        style={{
                            padding: '10px 32px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '15px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Processing...' : (step === 3 ? 'Publish' : 'Next')}
                    </button>
                </div>

                {/* Steps Indicator - Refined */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '48px', marginBottom: '40px', background: 'white', padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setStep(1)}>
                        <span style={{ fontSize: '18px', fontWeight: step === 1 ? '700' : '500', color: step === 1 ? '#2563eb' : '#64748b' }}>Course Details</span>
                        <ChevronRight size={18} color="#cbd5e1" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setStep(2)}>
                        <span style={{ fontSize: '18px', fontWeight: step === 2 ? '700' : '500', color: step === 2 ? '#2563eb' : '#64748b' }}>Chapters</span>
                        <ChevronRight size={18} color="#cbd5e1" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setStep(3)}>
                        <span style={{ fontSize: '18px', fontWeight: step === 3 ? '700' : '500', color: step === 3 ? '#2563eb' : '#64748b' }}>Map & Publish</span>
                    </div>
                </div>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Main Content Card - Step 1 */}
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {/* Banner Image Preview Area */}
                            <div style={{
                                height: '240px',
                                background: headerImage ? `url(${headerImage}) center/cover no-repeat` : '#cbd5e1',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#475569',
                                transition: 'all 0.3s',
                                borderBottom: '1px solid #e2e8f0'
                            }}>
                                {!headerImage && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <ImageIcon size={48} color="#94a3b8" />
                                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#64748b' }}>Course Header Image Preview</span>
                                    </div>
                                )}

                                <div style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    right: '20px',
                                    display: 'flex',
                                    gap: '10px'
                                }}>
                                    {!showURLInput.header ? (
                                        <>
                                            <button
                                                onClick={() => headerFileRef.current.click()}
                                                style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                            >
                                                <Upload size={14} /> Upload Media
                                            </button>
                                            <button
                                                onClick={() => setShowURLInput(prev => ({ ...prev, header: true }))}
                                                style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                            >
                                                <LinkIcon size={14} /> Paste URL
                                            </button>
                                            {headerImage && (
                                                <button
                                                    onClick={() => setHeaderImage('')}
                                                    style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                                            <input
                                                type="text"
                                                placeholder="Paste image URL here..."
                                                value={tempURL.header}
                                                onChange={(e) => setTempURL(prev => ({ ...prev, header: e.target.value }))}
                                                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', width: '250px', fontSize: '13px', outline: 'none' }}
                                            />
                                            <button onClick={() => handleURLSubmit('header')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Add</button>
                                            <button onClick={() => setShowURLInput(prev => ({ ...prev, header: false }))} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={headerFileRef} hidden onChange={(e) => handleFileChange(e, 'header')} accept="image/*" />
                            </div>

                            {/* Form Fields Grid - Restructured with Stable Sidebar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '0' }}>
                                {/* Left Section: Thumbnail, Category, Description, Instructors */}
                                <div style={{ padding: '32px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                                        {/* Thumbnail Column */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Course Thumbnail (Image/Video URL)</label>
                                            <div style={{
                                                width: '100%',
                                                aspectRatio: '16/10',
                                                background: thumbnail ? `url(${thumbnail}) center/cover no-repeat` : '#f1f5f9',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                position: 'relative',
                                                border: thumbnail ? 'none' : '1px solid #e2e8f0',
                                                overflow: 'hidden'
                                            }}>
                                                {!thumbnail ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                                                        <ImageIcon size={32} color="#94a3b8" />
                                                        <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '500' }}>
                                                            Drop image here or <br />
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                                                                <button onClick={() => thumbnailFileRef.current.click()} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Upload</button>
                                                                <span style={{ color: '#64748b' }}>or</span>
                                                                <button onClick={() => setShowURLInput(prev => ({ ...prev, thumbnail: true }))} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>URL</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setThumbnail('')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}><X size={14} /></button>
                                                )}
                                                {showURLInput.thumbnail && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '15px', gap: '8px' }}>
                                                        <input type="text" placeholder="Paste image URL..." value={tempURL.thumbnail} onChange={(e) => setTempURL(prev => ({ ...prev, thumbnail: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button onClick={() => handleURLSubmit('thumbnail')} style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Add</button>
                                                            <button onClick={() => setShowURLInput(prev => ({ ...prev, thumbnail: false }))} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="file" ref={thumbnailFileRef} hidden onChange={(e) => handleFileChange(e, 'thumbnail')} accept="image/*" />
                                            </div>
                                        </div>

                                        {/* Category & Description Column */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Category</label>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={selectedCategory}
                                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: '6px',
                                                            fontSize: '16px',
                                                            color: selectedCategory ? '#1e293b' : '#94a3b8',
                                                            outline: 'none',
                                                            appearance: 'none',
                                                            background: 'white'
                                                        }}
                                                    >
                                                        <option value="">Select</option>
                                                        {categories.map((cat, idx) => (
                                                            <option key={`${cat}-${idx}`} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                                </div>
                                            </div>




                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Description</label>
                                                <textarea
                                                    value={courseDescription}
                                                    onChange={(e) => setCourseDescription(e.target.value)}
                                                    placeholder="Course description..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        fontSize: '16px',
                                                        outline: 'none',
                                                        resize: 'none',
                                                        minHeight: '140px',
                                                        background: 'white',
                                                        flex: 1
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instructors Row */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Instructors</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative', width: '180px' }}>
                                                <select
                                                    onChange={(e) => {
                                                        const inst = instructorsList.find(i => i.id === parseInt(e.target.value));
                                                        if (inst && !selectedInstructors.find(si => si.id === inst.id)) {
                                                            setSelectedInstructors([...selectedInstructors, inst]);
                                                        }
                                                        e.target.value = '';
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 32px 10px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '14px',
                                                        color: '#64748b',
                                                        outline: 'none',
                                                        appearance: 'none',
                                                        background: '#ffffff'
                                                    }}
                                                >
                                                    <option value="">Select</option>
                                                    {instructorsList.map(inst => (
                                                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                            </div>

                                            {selectedInstructors.map(inst => (
                                                <div key={inst.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '4px 12px 4px 4px',
                                                    borderRadius: '24px',
                                                    border: '1px solid #e2e8f0',
                                                    background: '#ffffff',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    <img src={inst.avatar} alt={inst.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{inst.name}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedInstructors(prev => prev.filter(i => i.id !== inst.id)); }}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Attachments Sidebar */}
                                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Attachments ({attachments.length})</label>
                                        <button
                                            onClick={() => attachmentFileRef.current.click()}
                                            style={{
                                                background: '#ffffff',
                                                border: '1px solid #2563eb',
                                                color: '#2563eb',
                                                padding: '4px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <Upload size={12} /> Upload
                                        </button>
                                        <input type="file" ref={attachmentFileRef} hidden onChange={(e) => handleFileChange(e, 'attachment')} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {attachments.length === 0 && (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                                                No attachments yet
                                            </div>
                                        )}
                                        {attachments.map((file, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 16px',
                                                borderRadius: '24px',
                                                border: '1px solid #e2e8f0',
                                                background: '#ffffff',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                minWidth: 0
                                            }}>
                                                <Paperclip size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                                                <span style={{
                                                    fontSize: '13px',
                                                    color: '#1e293b',
                                                    flex: 1,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontWeight: '500',
                                                    minWidth: 0
                                                }}>
                                                    {file.name}
                                                </span>
                                                <button
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Youtube URL and Rich Text Editor Section - Refined Integration */}
                            <div style={{ background: '#f8fafc', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', borderTop: '1px solid #e2e8f0' }}>
                                {/* Youtube Preview Area */}
                                <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        background: videoId ? '#000000' : '#ef4444',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {videoId ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                style={{ border: 'none' }}
                                            ></iframe>
                                        ) : (
                                            <div style={{ background: 'white', borderRadius: '50%', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                <div style={{ width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '25px solid #ef4444', marginLeft: '5px' }}></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Youtube URL Input */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Youtube URL*</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <div style={{ width: 22, height: 16, background: '#ef4444', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <div style={{ width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '6px solid white' }}></div>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Paste youtube URL here*"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px 14px 50px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    background: 'white',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    transition: 'border-color 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Editor Area */}
                                <div style={{ width: '440px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <JoditEditor
                                        value={content}
                                        onBlur={newContent => setContent(newContent)}
                                        config={{
                                            readonly: false,
                                            height: 500,
                                            toolbarAdaptive: false,
                                            buttons: ['undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|', 'font', 'fontsize', 'paragraph', '|', 'image', 'video', 'table', 'link', '|', 'align', 'undo', 'redo', 'fullsize']
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        minHeight: '800px',
                        overflow: 'hidden'
                    }}>
                        {/* Left Side: Chapter List Sidebar */}
                        <div style={{ width: '380px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>Chapters</h2>

                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="Search Chapters, Quizes"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>


                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item, index) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setActiveItem(item)}
                                            style={{
                                                padding: '14px 16px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                background: activeItem?.id === item.id ? '#f0f7ff' : '#ffffff',
                                                border: activeItem?.id === item.id ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.2s',
                                                marginBottom: '4px',
                                                boxShadow: activeItem?.id === item.id ? '0 2px 8px rgba(59, 130, 246, 0.1)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', color: '#94a3b8', position: 'relative' }}>
                                                <div style={{ opacity: 0.5 }}><GripVertical size={18} /></div>
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                                                    <button onClick={(e) => handleMoveItem(e, index, -1)} disabled={index === 0} style={{ flex: 1, background: 'transparent', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: 'transparent', width: '100%' }} title="Move Up"></button>
                                                    <button onClick={(e) => handleMoveItem(e, index, 1)} disabled={index === items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase())).length - 1} style={{ flex: 1, background: 'transparent', border: 'none', cursor: index === items.length - 1 ? 'default' : 'pointer', color: 'transparent', width: '100%' }} title="Move Down"></button>
                                                </div>
                                            </div>

                                            <div style={{ width: '32px', height: '32px', background: item.type === 'quiz' ? '#eff6ff' : '#f8fafc', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                {item.type === 'quiz' ? <Rocket size={16} color="#2563eb" /> : <FileText size={16} color="#64748b" />}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {index + 1}. {item.title || 'Untitled Item'}
                                                </div>
                                            </div>

                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                                                    style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {openMenuId === item.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: '0',
                                                        top: '100%',
                                                        background: 'white',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                        zIndex: 10,
                                                        border: '1px solid #e2e8f0',
                                                        padding: '4px'
                                                    }}>
                                                        <button
                                                            onClick={(e) => { handleDeleteItem(e, item.id, item.type); setOpenMenuId(null); }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '8px 12px',
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                borderRadius: '4px',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Sidebar Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                                    <button onClick={() => handleAddItem('chapter')} style={{ flex: 1, padding: '10px 8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Chapter</button>
                                    <button onClick={() => handleAddItem('quiz')} style={{ flex: 1, padding: '10px 8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Quiz</button>
                                    <button onClick={() => handleAddItem('challenge')} style={{ flex: 1, padding: '10px 8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Challenge</button>
                                    <button onClick={() => handleAddItem('goal')} style={{ flex: 1, padding: '10px 8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Goal</button>
                                    <button style={{ flex: 1, padding: '10px 8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>More</button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Editor Workspace */}
                        <div style={{ flex: 1, background: '#f1f5f9', padding: '48px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                            {activeItem ? (
                                <div style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    padding: '40px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '32px',
                                    minHeight: '100%',
                                    overflowX: 'hidden'
                                }}>
                                    {/* Centered Mobile Column (440px) */}
                                    <div style={{ width: '440px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                        <input
                                            type="text"
                                            value={activeItem.title}
                                            onChange={(e) => updateActiveItem({ title: e.target.value })}
                                            placeholder="Untitled Item"
                                            style={{
                                                width: '100%',
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                color: '#1e293b',
                                                padding: '8px 0',
                                                border: 'none',
                                                borderBottom: '1px solid #e2e8f0',
                                                background: 'transparent',
                                                outline: 'none',
                                            }}
                                        />

                                        {activeItem.type === 'quiz' ? (
                                            /* Quiz Editor UI */
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
                                                        Total {activeItem.questions?.length || 0} Questions
                                                    </span>
                                                    <button
                                                        onClick={addQuestion}
                                                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                                                    >
                                                        Add Question
                                                    </button>
                                                </div>

                                                {activeItem.questions?.map((q, idx) => (
                                                    <div key={q.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Question {idx + 1}*</label>
                                                            <textarea
                                                                value={q.question}
                                                                onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                                                                placeholder="Type your question here"
                                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '14px', outline: 'none', resize: 'none' }}
                                                            />
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {['a', 'b', 'c', 'd'].map(opt => (
                                                                <div key={opt}>
                                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Answer {opt.toUpperCase()}*</label>
                                                                    <input
                                                                        type="text"
                                                                        value={q[opt]}
                                                                        onChange={(e) => updateQuestion(q.id, opt, e.target.value)}
                                                                        placeholder={`Option ${opt.toUpperCase()}`}
                                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Correct Answer*</label>
                                                                <select
                                                                    value={q.correct_answer || 'a'}
                                                                    onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)}
                                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: 'white' }}
                                                                >
                                                                    <option value="a">Option A</option>
                                                                    <option value="b">Option B</option>
                                                                    <option value="c">Option C</option>
                                                                    <option value="d">Option D</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Marks*</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={q.marks || 1}
                                                                    onChange={(e) => updateQuestion(q.id, 'marks', parseInt(e.target.value))}
                                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                                            <button
                                                                onClick={() => deleteQuestion(q.id)}
                                                                style={{ background: '#fef2f2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={handleSaveQuiz}
                                                                disabled={loading}
                                                                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                                            >
                                                                {loading ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Default Jodit Editor for Chapters/Others with YouTube Preview */
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                {/* YouTube Preview Card */}
                                                <div style={{
                                                    width: '100%',
                                                    aspectRatio: '16/9',
                                                    background: '#000',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}>
                                                    {getYoutubeVideoId(activeItem.youtube_url) ? (
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={`https://www.youtube.com/embed/${getYoutubeVideoId(activeItem.youtube_url)}`}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            title="YouTube video player"
                                                        ></iframe>
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4b5563', gap: '16px', background: '#f8fafc' }}>
                                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Youtube size={32} color="#ef4444" />
                                                            </div>
                                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>No Video Added</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* YouTube URL Input */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Video Youtube URL*</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }}>
                                                            <Youtube size={20} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Paste youtube URL here*"
                                                            value={activeItem.youtube_url || ''}
                                                            onChange={(e) => updateActiveItem({ youtube_url: e.target.value })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '14px 16px 14px 50px',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '14px',
                                                                outline: 'none',
                                                                background: 'white',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', background: 'white' }}>
                                                    <JoditEditor
                                                        value={activeItem.content}
                                                        config={{
                                                            ...editorConfig,
                                                            height: 600
                                                        }}
                                                        onBlur={newContent => updateActiveItem({ content: newContent })}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                                    <button
                                                        onClick={handleSaveChapter}
                                                        disabled={loading}
                                                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                                    >
                                                        {loading ? 'Saving...' : 'Save Chapter'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '20px' }}>
                                    <div style={{ padding: '32px', background: '#f1f5f9', borderRadius: '50%' }}>
                                        <Plus size={64} strokeWidth={1.5} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '20px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Select an item to edit</p>
                                        <p style={{ fontSize: '15px', maxWidth: '300px', lineHeight: '1.6' }}>Add a new Chapter or Quiz from the sidebar to start building your course content.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
                        {/* Mapping Configuration Card */}
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px' }}>
                            <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', alignItems: 'flex-start' }}>
                                {/* User Selector Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '260px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                        <input
                                            type="radio"
                                            name="mappingType"
                                            checked={mappingType === 'user'}
                                            onChange={() => setMappingType('user')}
                                            style={{ width: '20px', height: '20px', accentColor: '#2563eb' }}
                                        />
                                        User
                                    </label>

                                    {(mappingType === 'user' || mappingType === 'both') && (
                                        <div style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '12px',
                                            padding: '24px 20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            {['Premium', 'Ultra'].map(u => (
                                                <label key={u} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserTypes.includes(u)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedUserTypes([...selectedUserTypes, u]);
                                                            else setSelectedUserTypes(selectedUserTypes.filter(ut => ut !== u));
                                                        }}
                                                        style={{ width: '20px', height: '20px', accentColor: '#2563eb', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                    />
                                                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#000000' }}>{u}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* School Selector Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '320px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                        <input
                                            type="radio"
                                            name="mappingType"
                                            checked={mappingType === 'school'}
                                            onChange={() => setMappingType('school')}
                                            style={{ width: '20px', height: '20px', accentColor: '#2563eb' }}
                                        />
                                        School
                                    </label>

                                    {(mappingType === 'school' || mappingType === 'both') && (
                                        <div style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                        }}>
                                            <div style={{ borderBottom: '1px solid #cbd5e1', padding: '12px 16px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    value={schoolSearch}
                                                    onChange={(e) => setSchoolSearch(e.target.value)}
                                                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '18px', color: '#000000', fontWeight: '700' }}
                                                />
                                            </div>
                                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '250px', overflowY: 'auto' }}>
                                                {schools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase())).map(s => (
                                                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSchoolIds.includes(s.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedSchoolIds([...selectedSchoolIds, s.id]);
                                                                else setSelectedSchoolIds(selectedSchoolIds.filter(id => id !== s.id));
                                                            }}
                                                            style={{ width: '20px', height: '20px', accentColor: '#2563eb', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                        />
                                                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#000000' }}>{s.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Both Selector Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                        <input
                                            type="radio"
                                            name="mappingType"
                                            checked={mappingType === 'both'}
                                            onChange={() => setMappingType('both')}
                                            style={{ width: '20px', height: '20px', accentColor: '#2563eb' }}
                                        />
                                        Both
                                    </label>
                                </div>
                            </div>

                            {/* Grades Section (Light Gray Bar) */}
                            <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '30px', display: 'flex', alignItems: 'center', gap: '60px', marginBottom: '32px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Grades</span>
                                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                    <select
                                        value={selectedGradeId}
                                        onChange={(e) => setSelectedGradeId(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '700', appearance: 'none', background: 'transparent' }}
                                    >
                                        <option value="">Select Grade</option>
                                        {grades.map(g => <option key={g.id} value={g.id}>{g.name || `Grade ${g.id}`}</option>)}
                                    </select>
                                    <ChevronDown size={20} color="#64748b" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button
                                    onClick={() => {
                                        setSelectedUserTypes([]);
                                        setSelectedSchoolIds([]);
                                        setMappingType('both');
                                    }}
                                    style={{ padding: '10px 24px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer', background: 'white' }}
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleUpdateVisibility}
                                    disabled={loading}
                                    style={{ padding: '10px 48px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        {/* Final Publish Status Card */}
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                            <p style={{ fontSize: '16px', fontWeight: '600', color: '#475569', textAlign: 'center', maxWidth: '280px', lineHeight: '1.5' }}>
                                Once you have configured the mapping and saved the settings, you can publish the course to make it live for students.
                            </p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button style={{ padding: '10px 24px', border: '1px solid #2563eb', color: '#2563eb', background: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                    Preview Course
                                </button>
                                <button
                                    onClick={handlePublish}
                                    disabled={loading}
                                    style={{ padding: '10px 32px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Publishing...' : 'Publish Course'}
                                </button>
                            </div>
                        </div>

                        {/* Mapped/Unmapped Courses Table Section */}
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                <button
                                    onClick={() => setActiveTab('unmapped')}
                                    style={{ flex: 1, padding: '16px', border: 'none', background: activeTab === 'unmapped' ? '#f8fafc' : 'white', fontWeight: '700', color: activeTab === 'unmapped' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'unmapped' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}
                                >
                                    Unmapped Courses
                                </button>
                                <button
                                    onClick={() => setActiveTab('mapped')}
                                    style={{ flex: 1, padding: '16px', border: 'none', background: activeTab === 'mapped' ? '#f8fafc' : 'white', fontWeight: '700', color: activeTab === 'mapped' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'mapped' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}
                                >
                                    Mapped Courses
                                </button>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Course Name</th>
                                            <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>School ID</th>
                                            <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Area</th>
                                            <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>City</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredCourses().length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No courses found</td>
                                            </tr>
                                        ) : (
                                            getFilteredCourses().map((c, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{c.title || c.name}</td>
                                                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{c.displaySchoolId}</td>
                                                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{c.displayArea}</td>
                                                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{c.displayCity}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .thumbnail-overlay:hover {
                    opacity: 1 !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </Layout >
    );
};

export default NewCoursePage;
