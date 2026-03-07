import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/common/Layout';
import JoditEditor from 'jodit-react';
import {
    ChevronLeft, Image as ImageIcon, Video, HelpCircle,
    ChevronDown, ChevronUp, Upload, Link as LinkIcon, X, GripVertical,
    FileText, MoreVertical, Trash2, Plus, Layout as LayoutIcon, Rocket,
    Paperclip, Youtube, ArrowRight
} from 'lucide-react';
import {
    getCategories, getCourses, getCourseById, addChapter, createQuiz,
    updateCourseVisibility, getSchools, getGrades, getMappings,
    updateChapter, updateQuiz, deleteChapter, deleteQuiz, updateChapterOrder,
    createMapping, updateCourse
} from '../services/api';
import toast from 'react-hot-toast';

const EditCoursePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [courseName, setCourseName] = useState('');
    const [headerImage, setHeaderImage] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [selectedInstructors, setSelectedInstructors] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [allCourses, setAllCourses] = useState([]);
    const [instructorsList] = useState([
        { id: 1, name: 'Jasmine Ahuja Kher', avatar: 'https://i.pravatar.cc/150?u=jasmine' },
        { id: 2, name: 'John Peter Long name..', avatar: 'https://i.pravatar.cc/150?u=john' }
    ]);
    const [showURLInput, setShowURLInput] = useState({ header: false, thumbnail: false });
    const [tempURL, setTempURL] = useState({ header: '', thumbnail: '' });

    const headerFileRef = useRef(null);
    const thumbnailFileRef = useRef(null);
    const attachmentFileRef = useRef(null);

    const [step, setStep] = useState(1);
    const [content, setContent] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [mappingLoading, setMappingLoading] = useState(false);
    const [publishingLoading, setPublishingLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [items, setItems] = useState([]);
    const [activeItem, setActiveItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const [mappingType, setMappingType] = useState('both');
    const [selectedUserTypes, setSelectedUserTypes] = useState([]);
    const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
    const [selectedGradeIds, setSelectedGradeIds] = useState([]);
    const [schools, setSchools] = useState([]);
    const [grades, setGrades] = useState([]);
    const [mappings, setMappings] = useState([]);

    const [selectedUnmappedIds, setSelectedUnmappedIds] = useState([]);
    const [selectedMappedIds, setSelectedMappedIds] = useState([]);
    const [unmappedSearch, setUnmappedSearch] = useState('');
    const [mappedSearch, setMappedSearch] = useState('');
    const [mappedSchools, setMappedSchools] = useState([]);
    const [unmappedSchools, setUnmappedSchools] = useState([]);
    const [gradesDropdownOpen, setGradesDropdownOpen] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Load course data + all supporting data on mount
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setInitialLoading(true);

                // Sequential calls to avoid rate limiting
                const catsRes = await getCategories();
                const coursesRes = await getCourses();
                const schoolsRes = await getSchools();
                const gradesRes = await getGrades();
                const mappingsRes = await getMappings({ limit: 1000 });

                const mappingsData = Array.isArray(mappingsRes) ? mappingsRes : (mappingsRes.items || mappingsRes.data || []);
                setMappings(mappingsData);

                const coursesData = coursesRes.data || coursesRes.items || (Array.isArray(coursesRes) ? coursesRes : []);
                setAllCourses(coursesData);
                const courseFromList = coursesData.find(c => String(c.id) === String(id));

                // 2. Fetch specific course details (usually has more addons like chapters/quizzes)
                let course;
                try {
                    course = await getCourseById(id);
                } catch (err) {
                    console.error("Single course fetch failed, falling back to list data:", err);
                    course = courseFromList;
                }

                if (course) {
                    setCourseName(course.title || course.name || '');
                    setSelectedCategory(course.category || '');
                    setHeaderImage(course.header_image_url || '');
                    setThumbnail(course.thumbnail_url || '');
                    setCourseDescription(course.description || '');
                    setContent(course.body_content || '');
                    setYoutubeUrl(course.youtube_url || '');
                    setAttachments(
                        Array.isArray(course.attachments)
                            ? course.attachments.map(a => (typeof a === 'string' ? { name: a } : a))
                            : []
                    );
                    if (Array.isArray(course.instructor)) {
                        const preselected = instructorsList.filter(i => course.instructor.includes(i.id));
                        setSelectedInstructors(preselected);
                    }
                    if (Array.isArray(course.grades)) {
                        setSelectedGradeIds(course.grades.map(Number));
                    }
                    setCurrentCourseId(course.id);

                    // --- Load Chapters and Quizzes ---
                    // Broad mapping to catch variations in API response names
                    const chaptersRaw = course.chapters || course.chapters_list || course._chapters || course.course_chapters || [];
                    const quizzesRaw = course.quizzes || course.quizzes_list || course._quizzes || course.course_quizzes || [];

                    const loadedChapters = chaptersRaw.map(ch => ({
                        id: ch.id,
                        type: ch.type || 'chapter',
                        title: ch.title || '',
                        content: ch.body_content || '',
                        youtube_url: ch.youtube_url || '',
                        order: ch.sequence_order || 0
                    }));

                    const loadedQuizzes = quizzesRaw.map(qz => ({
                        id: qz.id,
                        type: 'quiz',
                        title: qz.title || '',
                        questions: (qz.questions || []).map(q => ({
                            id: q.id || Date.now() + Math.random(),
                            question: q.question_text || q.question || '',
                            a: q.answer_a || q.a || '',
                            b: q.answer_b || q.b || '',
                            c: q.answer_c || q.c || '',
                            d: q.answer_d || q.d || '',
                            correct_answer: q.correct_answer || 'a',
                            marks: q.marks || 1
                        })),
                        order: qz.sequence_order || 0
                    }));

                    const combinedItems = [...loadedChapters, ...loadedQuizzes].sort((a, b) => (a.order || 0) - (b.order || 0));
                    setItems(combinedItems);
                    if (combinedItems.length > 0) {
                        setActiveItem(combinedItems[0]);
                    }

                    // --- NEW: Pre-select User Types from existing mappings ---
                    if (mappingsData.length > 0) {
                        const courseMappings = mappingsData.filter(m => String(m.course_id ?? m.content_id) === String(id));
                        const existingTypes = [...new Set(courseMappings.map(m => {
                            const t = m.subscription_type || '';
                            if (t.toLowerCase() === 'premium') return 'Premium';
                            if (t.toLowerCase() === 'ultra') return 'Ultra';
                            return '';
                        }))].filter(Boolean);
                        if (existingTypes.length > 0) {
                            setSelectedUserTypes(existingTypes);
                        }
                    }
                } else {
                    toast.error('Course not found.');
                    navigate('/admin/mappings/view?assetType=course');
                    return;
                }

                const rawCats = catsRes.data || catsRes.items || (Array.isArray(catsRes) ? catsRes : []);
                const catsFromEndpoint = rawCats.map(c => {
                    if (typeof c === 'string') return c;
                    return c.category_name || c.name || c.title || c.label;
                }).filter(Boolean);
                const catsFromCourses = coursesData.map(c => c.category).filter(Boolean);
                const allUniqueCats = [...new Set([...catsFromEndpoint, ...catsFromCourses])].sort();
                setCategories(allUniqueCats);

                const schoolsData = schoolsRes.data || schoolsRes.items || (Array.isArray(schoolsRes) ? schoolsRes : []);
                setSchools(schoolsData);
                setUnmappedSchools(schoolsData);
                setMappedSchools([]);

                setGrades(gradesRes.data || gradesRes.items || (Array.isArray(gradesRes) ? gradesRes : []));
            } catch (err) {
                console.error('Failed to load course data:', err);
                toast.error('Failed to load course data.');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchAll();
    }, [id]);

    // Sync mapped/unmapped schools
    useEffect(() => {
        if (!schools.length) return;

        const getSchoolId = (m) => {
            const sid = m.school_id ?? m.school?.id ?? (typeof m.school === 'number' ? m.school : null);
            const num = Number(sid);
            return Number.isFinite(num) ? num : null;
        };

        const relevantMappings = (mappings || []).filter(m => {
            const isThisCourse = String(m.course_id ?? m.content_id ?? '') === String(currentCourseId);
            const matchesUserType = selectedUserTypes.length === 0 || selectedUserTypes.some(ut => String(ut).toLowerCase() === String(m.subscription_type || '').toLowerCase());
            const mGradeIds = (m.grade_ids || []).map(String);
            const matchesGrade = selectedGradeIds.length === 0 || selectedGradeIds.some(gid => mGradeIds.includes(String(gid)));
            return isThisCourse && matchesUserType && matchesGrade;
        });

        const mappedSchoolIds = new Set(relevantMappings.map(getSchoolId).filter(Boolean));
        setMappedSchools(schools.filter(s => mappedSchoolIds.has(Number(s.id))));
        setUnmappedSchools(schools.filter(s => !mappedSchoolIds.has(Number(s.id))));
    }, [selectedUserTypes, selectedGradeIds, currentCourseId, mappings, schools]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) { toast.error('File size must be less than 1MB'); return; }
            if (type === 'attachment') { setAttachments(prev => [...prev, { name: file.name, size: file.size }]); return; }
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

    const editorConfig = {
        readonly: false,
        placeholder: 'Start typing...',
        height: 500,
        toolbarAdaptive: false,
        buttons: ['undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|', 'font', 'fontsize', 'paragraph', '|', 'image', 'video', 'table', 'link', '|', 'align', 'fullsize']
    };

    const isStep1MandatoryFilled = Boolean(
        (courseName || '').trim() &&
        (selectedCategory || '').trim() &&
        (thumbnail || '').trim() &&
        (headerImage || '').trim() &&
        (youtubeUrl || '').trim()
    );

    // Save course details (Step 1) — calls update_course
    const handleSaveCourseDetails = async () => {
        if (!(courseName || '').trim()) { toast.error('Course name is required.'); return; }
        if (!(selectedCategory || '').trim()) { toast.error('Category is required.'); return; }
        if (!(headerImage || '').trim()) { toast.error('Header image is required.'); return; }
        if (!(thumbnail || '').trim()) { toast.error('Thumbnail is required.'); return; }
        if (!(youtubeUrl || '').trim()) { toast.error('Video (YouTube URL) is required.'); return; }

        try {
            setLoading(true);
            const payload = {
                title: courseName,
                category: selectedCategory,
                instructor: selectedInstructors.map(i => i.id),
                description: courseDescription,
                thumbnail_url: thumbnail,
                header_image_url: headerImage,
                body_content: content,
                youtube_url: youtubeUrl,
                attachments: attachments.map(a => ({ name: a.name })),
                visibility_level: 'public',
                grades: selectedGradeIds.map(Number)
            };
            await updateCourse(currentCourseId, payload);
            toast.success('Course details updated.');
            setStep(2);
        } catch (err) {
            console.error('Failed to update course:', err);
            toast.error(err.message || 'Failed to update course.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (type) => {
        if (!currentCourseId) { toast.error('Course ID not found.'); return; }
        try {
            let newItemId;
            if (type === 'chapter' || type === 'challenge' || type === 'goal') {
                const res = await addChapter({
                    course_id: Number(currentCourseId),
                    title: `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    type,
                    body_content: '',
                    parent_id: null,
                    youtube_url: ''
                });
                newItemId = res?.id || res?.course_id || res?.chapter_id;
            } else if (type === 'quiz') {
                const res = await createQuiz({
                    course_id: Number(currentCourseId),
                    chapter_id: null,
                    title: 'Untitled Quiz',
                    sequence_order: 0,
                    questions: []
                });
                newItemId = res?.quiz?.id || res?.id || res?.quiz_id;
            }
            const newItem = {
                id: newItemId || Date.now(),
                type,
                title: type === 'quiz' ? 'Untitled Quiz' : `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                content: '',
                questions: type === 'quiz' ? [{ id: Date.now(), question: '', a: '', b: '', c: '', d: '', correct_answer: 'a', marks: 1 }] : []
            };
            setItems(prev => [...prev, newItem]);
            setActiveItem(newItem);
            toast.success(`${type} added.`);
        } catch (err) {
            toast.error(err.message || `Failed to add ${type}.`);
        }
    };

    const addQuestion = () => {
        if (activeItem?.type !== 'quiz') return;
        updateActiveItem({ questions: [...(activeItem.questions || []), { id: Date.now(), question: '', a: '', b: '', c: '', d: '', correct_answer: 'a', marks: 1 }] });
    };

    const deleteQuestion = (qId) => updateActiveItem({ questions: activeItem.questions.filter(q => q.id !== qId) });

    const updateQuestion = (qId, field, value) => {
        updateActiveItem({ questions: activeItem.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) });
    };

    const updateActiveItem = (updates) => {
        if (!activeItem) return;
        const updated = { ...activeItem, ...updates };
        setActiveItem(updated);
        setItems(prev => prev.map(item => item.id === activeItem.id && item.type === activeItem.type ? updated : item));
    };

    const handleSaveChapter = async () => {
        if (!activeItem || (activeItem.type !== 'chapter' && activeItem.type !== 'challenge' && activeItem.type !== 'goal')) return;
        try {
            setLoading(true);
            await updateChapter(activeItem.id, { title: activeItem.title, body_content: activeItem.content, youtube_url: activeItem.youtube_url });
            toast.success('Chapter saved.');
        } catch (err) {
            toast.error('Failed to save chapter.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuiz = async () => {
        if (!activeItem || activeItem.type !== 'quiz') return;
        try {
            setLoading(true);
            await updateQuiz(activeItem.id, {
                title: activeItem.title,
                questions: (activeItem.questions || []).map((q, idx) => ({
                    question_text: q.question, answer_a: q.a, answer_b: q.b,
                    answer_c: q.c, answer_d: q.d, correct_answer: q.correct_answer, sequence_order: idx + 1
                }))
            });
            toast.success('Quiz saved.');
        } catch (err) {
            toast.error('Failed to save quiz.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (e, itemId, type) => {
        e.stopPropagation();
        if (!window.confirm(`Delete this ${type}?`)) return;
        try {
            if (type === 'quiz') await deleteQuiz(itemId);
            else await deleteChapter(itemId);
            setItems(prev => prev.filter(item => !(item.id === itemId && item.type === type)));
            if (activeItem?.id === itemId && activeItem?.type === type) setActiveItem(null);
            toast.success(`${type} deleted.`);
        } catch (err) {
            toast.error('Failed to delete item.');
        }
    };

    const handleDragStart = (e, index) => { setDraggedItemIndex(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); };
    const handleDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(index); };
    const handleDragLeave = (e) => { e.preventDefault(); setDragOverIndex(null); };
    const handleDragEnd = () => { setDraggedItemIndex(null); setDragOverIndex(null); };

    const handleDrop = async (e, droppedOnIndex) => {
        e.preventDefault();
        setDragOverIndex(null);
        if (draggedItemIndex === null || draggedItemIndex === droppedOnIndex) return;
        const filtered = items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const draggedItem = filtered[draggedItemIndex];
        const targetItem = filtered[droppedOnIndex];
        const dragIdx = items.findIndex(i => i.id === draggedItem.id && i.type === draggedItem.type);
        const targetIdx = items.findIndex(i => i.id === targetItem.id && i.type === targetItem.type);
        if (dragIdx === -1 || targetIdx === -1) return;
        const newItems = [...items];
        const [removed] = newItems.splice(dragIdx, 1);
        newItems.splice(targetIdx, 0, removed);
        setItems(newItems);
        setDraggedItemIndex(null);
        try {
            await updateChapterOrder(newItems.map((item, idx) => ({ id: item.id, order: idx + 1, type: item.type === 'quiz' ? 'quiz' : 'chapter' })));
        } catch (err) {
            console.error('Order update failed:', err);
        }
    };

    const handleApplyMapping = async () => {
        if (!currentCourseId) { toast.error('Course ID not found.'); return; }
        if (selectedGradeIds.length === 0) { toast.error('Select at least one grade.'); return; }
        if (selectedUserTypes.length === 0) { toast.error('Select at least one user type.'); return; }
        if (mappedSchools.length === 0) { toast.error('No schools in the Mapped list.'); return; }
        setMappingLoading(true);
        try {
            const promises = [];
            for (const school of mappedSchools) {
                for (const userType of selectedUserTypes) {
                    promises.push(createMapping({
                        content_type: 'course', content_id: String(currentCourseId), content_title: courseName,
                        school_id: Number(school.id), grade_ids: selectedGradeIds.map(Number),
                        subscription_type: userType.toLowerCase(), is_active: true, assigned_by: 1
                    }));
                }
            }
            await Promise.all(promises);

            toast.success(`Mapping applied successfully to ${mappedSchools.length} schools.`);
        } catch (err) {
            toast.error('Failed to apply mapping.');
        } finally {
            setMappingLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!currentCourseId) {
            toast.error("Course ID not found.");
            return;
        }
        setPublishingLoading(true);
        try {
            await publishCourse({
                course_id: Number(currentCourseId),
                is_published: true,
                visibility_level: 'public'
            });
            toast.success('Course Published successfully');

            // Redirect to dashboard with filters applied
            const params = new URLSearchParams();
            params.set('assetType', 'course');
            params.set('search', courseName);

            setTimeout(() => {
                navigate(`/admin/mappings/view?${params.toString()}`);
            }, 1500);
        } catch (err) {
            console.error("Publish error:", err);
            toast.error("Failed to publish course.");
        } finally {
            setPublishingLoading(false);
        }
    };

    const getYoutubeVideoId = (url) => {
        const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeVideoId(youtubeUrl);

    if (initialLoading) {
        return (
            <Layout title="Edit Course">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #bfdbfe', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    <p style={{ color: '#64748b', fontWeight: '500' }}>Loading course...</p>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Edit Course">
            <div className="new-course-page animate-fade-in" style={{ paddingBottom: '40px' }}>

                {/* Top Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 32px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ChevronLeft size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => { if (step === 1) navigate('/admin/mappings/view?assetType=course'); else setStep(s => s - 1); }} />
                        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Courses / Edit Course</h1>
                        <input
                            type="text"
                            placeholder="Course name"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 16px', fontSize: '15px', fontWeight: '500', width: '300px', outline: 'none', background: 'white' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {step === 3 && (
                            <button onClick={() => setShowPreviewModal(true)} style={{ padding: '10px 24px', background: 'white', color: '#2563eb', border: '2px solid #2563eb', borderRadius: '6px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                                Preview Course
                            </button>
                        )}
                        <button
                            onClick={step === 1 ? handleSaveCourseDetails : step === 2 ? () => setStep(3) : handlePublish}
                            disabled={loading || publishingLoading || (step === 1 && !isStep1MandatoryFilled)}
                            style={{
                                padding: '10px 48px',
                                background: (step === 1 && !isStep1MandatoryFilled) ? '#94a3b8' : '#2563eb',
                                color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '14px',
                                cursor: loading || publishingLoading || (step === 1 && !isStep1MandatoryFilled) ? 'not-allowed' : 'pointer',
                                opacity: loading || publishingLoading ? 0.7 : 1
                            }}
                        >
                            {publishingLoading ? 'Processing...' : step === 1 ? 'Save & Next' : step === 2 ? 'Next' : 'Publish Course'}
                        </button>
                    </div>
                </div>

                {/* Breadcrumb Steps */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', padding: '40px 0' }}>
                    {[{ label: 'Course Details', num: 1 }, { label: 'Chapters', num: 2 }, { label: 'Map & Publish', num: 3 }].map((s, idx) => (
                        <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button type="button" onClick={() => setStep(s.num)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '18px', fontWeight: step === s.num ? '700' : '500', color: step === s.num ? '#1e293b' : '#64748b' }}>
                                {s.label}
                            </button>
                            {idx < 2 && <div style={{ width: '80px', height: '1px', background: '#cbd5e1' }}></div>}
                        </div>
                    ))}
                </div>

                {/* ── STEP 1: Course Details ── */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {/* Header Image */}
                            <div style={{ height: '240px', background: headerImage ? `url(${headerImage}) center/cover no-repeat` : '#cbd5e1', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                {!headerImage && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <ImageIcon size={48} color="#94a3b8" />
                                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#64748b' }}>Course Header Image Preview</span>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                                    {!showURLInput.header ? (
                                        <>
                                            <button onClick={() => headerFileRef.current.click()} style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                                                <Upload size={14} /> Upload Media
                                            </button>
                                            <button onClick={() => setShowURLInput(prev => ({ ...prev, header: true }))} style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                                                <LinkIcon size={14} /> Paste URL
                                            </button>
                                            {headerImage && <button onClick={() => setHeaderImage('')} style={{ background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><X size={14} /></button>}
                                        </>
                                    ) : (
                                        <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                            <input type="text" placeholder="Paste image URL..." value={tempURL.header} onChange={(e) => setTempURL(prev => ({ ...prev, header: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', width: '250px', fontSize: '13px', outline: 'none' }} />
                                            <button onClick={() => handleURLSubmit('header')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Add</button>
                                            <button onClick={() => setShowURLInput(prev => ({ ...prev, header: false }))} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}><X size={14} /></button>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={headerFileRef} hidden onChange={(e) => handleFileChange(e, 'header')} accept="image/*" />
                            </div>

                            {/* Form Fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '0' }}>
                                <div style={{ padding: '32px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                                        {/* Thumbnail */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Course Thumbnail</label>
                                            <div style={{ width: '100%', aspectRatio: '16/10', background: thumbnail ? `url(${thumbnail}) center/cover no-repeat` : '#f1f5f9', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', border: thumbnail ? 'none' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                {!thumbnail ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                                                        <ImageIcon size={32} color="#94a3b8" />
                                                        <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '500' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                                                                <button onClick={() => thumbnailFileRef.current.click()} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Upload</button>
                                                                <span style={{ color: '#64748b' }}>or</span>
                                                                <button onClick={() => setShowURLInput(prev => ({ ...prev, thumbnail: true }))} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>URL</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setThumbnail('')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}><X size={14} /></button>
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

                                        {/* Category + Description */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Category</label>
                                                <div style={{ position: 'relative' }}>
                                                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '16px', color: selectedCategory ? '#1e293b' : '#94a3b8', outline: 'none', appearance: 'none', background: 'white' }}>
                                                        <option value="">Select</option>
                                                        {categories.map((cat, idx) => <option key={`${cat}-${idx}`} value={cat}>{cat}</option>)}
                                                    </select>
                                                    <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <label style={{ display: 'block', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Description</label>
                                                <textarea value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} placeholder="Course description..." style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '16px', outline: 'none', resize: 'none', minHeight: '140px', background: 'white' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instructors */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Instructors</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative', width: '180px' }}>
                                                <select onChange={(e) => { const inst = instructorsList.find(i => i.id === parseInt(e.target.value)); if (inst && !selectedInstructors.find(si => si.id === inst.id)) setSelectedInstructors([...selectedInstructors, inst]); e.target.value = ''; }} style={{ width: '100%', padding: '10px 32px 10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#64748b', outline: 'none', appearance: 'none', background: '#ffffff' }}>
                                                    <option value="">Select</option>
                                                    {instructorsList.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                                                </select>
                                                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                            </div>
                                            {selectedInstructors.map(inst => (
                                                <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 4px 4px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                                                    <img src={inst.avatar} alt={inst.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{inst.name}</span>
                                                    <button onClick={() => setSelectedInstructors(prev => prev.filter(i => i.id !== inst.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments Sidebar */}
                                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Attachments ({attachments.length})</label>
                                        <button onClick={() => attachmentFileRef.current.click()} style={{ background: '#ffffff', border: '1px solid #2563eb', color: '#2563eb', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                                            <Upload size={12} /> Upload
                                        </button>
                                        <input type="file" ref={attachmentFileRef} hidden onChange={(e) => handleFileChange(e, 'attachment')} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {attachments.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>No attachments yet</div>}
                                        {attachments.map((file, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                                                <Paperclip size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                                                <span style={{ fontSize: '13px', color: '#1e293b', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>{file.name}</span>
                                                <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* YouTube + Editor */}
                            <div style={{ background: '#f8fafc', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ width: '100%', aspectRatio: '16/9', background: videoId ? '#000000' : '#ef4444', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                        {videoId ? (
                                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allowFullScreen style={{ border: 'none' }}></iframe>
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ background: 'white', borderRadius: '50%', padding: '20px' }}>
                                                    <div style={{ width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '25px solid #ef4444', marginLeft: '5px' }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Youtube URL*</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: 22, height: 16, background: '#ef4444', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <div style={{ width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '6px solid white' }}></div>
                                            </div>
                                            <input type="text" placeholder="Paste youtube URL here*" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} style={{ width: '100%', padding: '14px 16px 14px 50px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white' }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ width: '440px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                    <JoditEditor value={content} onBlur={newContent => setContent(newContent)} config={editorConfig} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Chapters ── */}
                {step === 2 && (
                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', minHeight: '800px', overflow: 'hidden' }}>
                        {/* Sidebar */}
                        <div style={{ width: '380px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>Chapters</h2>
                                <input type="text" placeholder="Search Chapters, Quizzes" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '14px', outline: 'none', marginBottom: '16px' }} />
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item, index) => (
                                        <div key={`${item.type}-${item.id}`} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragLeave={handleDragLeave} onDragEnd={handleDragEnd} onDrop={(e) => handleDrop(e, index)} onClick={() => setActiveItem(item)}
                                            style={{ padding: '14px 16px', borderRadius: '10px', cursor: 'grab', background: (activeItem?.id === item.id && activeItem?.type === item.type) ? '#f0f7ff' : (dragOverIndex === index ? '#e0f2fe' : '#ffffff'), border: (activeItem?.id === item.id && activeItem?.type === item.type) ? '1px solid #3b82f6' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', opacity: draggedItemIndex === index ? 0.5 : 1 }}>
                                            <GripVertical size={20} color="#94a3b8" />
                                            <div style={{ width: '32px', height: '32px', background: item.type === 'quiz' ? '#eff6ff' : '#f8fafc', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                {item.type === 'quiz' ? <Rocket size={16} color="#2563eb" /> : <FileText size={16} color="#64748b" />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{index + 1}. {item.title || 'Untitled'}</div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <button onClick={(e) => { e.stopPropagation(); const composite = `${item.type}-${item.id}`; setOpenMenuId(openMenuId === composite ? null : composite); }} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                                                    <MoreVertical size={18} />
                                                </button>
                                                {openMenuId === `${item.type}-${item.id}` && (
                                                    <div style={{ position: 'absolute', right: '0', top: '100%', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, border: '1px solid #e2e8f0', padding: '4px' }}>
                                                        <button onClick={(e) => { handleDeleteItem(e, item.id, item.type); setOpenMenuId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                                    {['chapter', 'quiz', 'challenge', 'goal'].map(type => (
                                        <button key={type} onClick={() => handleAddItem(type)} style={{ flex: 1, padding: '10px 8px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            + {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Editor Workspace */}
                        <div style={{ flex: 1, background: '#f1f5f9', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                            {activeItem ? (
                                <div style={{ width: '440px', maxWidth: '100%', background: '#ffffff', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                        <input type="text" value={activeItem.title} onChange={(e) => updateActiveItem({ title: e.target.value })} placeholder="Untitled Item" style={{ flex: 1, fontSize: '28px', fontWeight: '700', color: '#1e293b', padding: '8px 0', border: 'none', borderBottom: '1px solid #e2e8f0', background: 'transparent', outline: 'none' }} />
                                    </div>

                                    {activeItem.type === 'quiz' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>Total {activeItem.questions?.length || 0} Questions</span>
                                                <button onClick={addQuestion} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Add Question</button>
                                            </div>
                                            {activeItem.questions?.map((q, idx) => (
                                                <div key={q.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Question {idx + 1}*</label>
                                                        <textarea value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)} placeholder="Type your question here" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '14px', outline: 'none', resize: 'none' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {['a', 'b', 'c', 'd'].map(opt => (
                                                            <div key={opt}>
                                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Answer {opt.toUpperCase()}*</label>
                                                                <input type="text" value={q[opt]} onChange={(e) => updateQuestion(q.id, opt, e.target.value)} placeholder={`Option ${opt.toUpperCase()}`} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Correct Answer*</label>
                                                            <select value={q.correct_answer || 'a'} onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: 'white' }}>
                                                                {['a', 'b', 'c', 'd'].map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Marks*</label>
                                                            <input type="number" min="1" value={q.marks || 1} onChange={(e) => updateQuestion(q.id, 'marks', parseInt(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                        <button onClick={() => deleteQuestion(q.id)} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                        <button onClick={handleSaveQuiz} disabled={loading} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>{loading ? 'Saving...' : 'Save'}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                                                {getYoutubeVideoId(activeItem.youtube_url) ? (
                                                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYoutubeVideoId(activeItem.youtube_url)}`} frameBorder="0" allowFullScreen title="YouTube video player"></iframe>
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f8fafc' }}>
                                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Youtube size={32} color="#ef4444" /></div>
                                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>No Video Added</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Video Youtube URL*</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Youtube size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />
                                                    <input type="text" placeholder="Paste youtube URL here*" value={activeItem.youtube_url || ''} onChange={(e) => updateActiveItem({ youtube_url: e.target.value })} style={{ width: '100%', padding: '14px 16px 14px 50px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }} />
                                                </div>
                                            </div>
                                            <div style={{ width: '100%', maxWidth: '440px', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', background: 'white' }}>
                                                <JoditEditor value={activeItem.content} config={{ ...editorConfig, height: 600, width: 440 }} onBlur={newContent => updateActiveItem({ content: newContent })} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button onClick={handleSaveChapter} disabled={loading} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                                                    {loading ? 'Saving...' : 'Save Chapter'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '20px' }}>
                                    <div style={{ padding: '32px', background: '#f1f5f9', borderRadius: '50%' }}><Plus size={64} strokeWidth={1.5} /></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '20px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Select an item to edit</p>
                                        <p style={{ fontSize: '15px', maxWidth: '300px', lineHeight: '1.6' }}>Add or select a Chapter or Quiz from the sidebar.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Map & Publish ── */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 32px 64px' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                            {/* Grades */}
                            <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', width: '380px', position: 'relative' }}>
                                <div style={{ padding: '0 16px', fontSize: '14px', fontWeight: '700', color: '#1e293b', borderRight: '1px solid #cbd5e1', height: '100%', display: 'flex', alignItems: 'center', background: '#f8fafc' }}>Grades*</div>
                                <div onClick={() => setGradesDropdownOpen(prev => !prev)} style={{ flex: 1, padding: '12px 36px 12px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: selectedGradeIds.length ? '#1e293b' : '#64748b', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                                    {selectedGradeIds.length === 0 ? 'Select grades' : grades.length > 0 && selectedGradeIds.length === grades.length ? 'All grades selected' : grades.filter(g => selectedGradeIds.includes(g.id)).map(g => g.name || `Grade ${g.id}`).join(', ')}
                                </div>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: gradesDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
                                {gradesDropdownOpen && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setGradesDropdownOpen(false)} />
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '240px', overflowY: 'auto', padding: '8px 0' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>
                                                <input type="checkbox" checked={grades.length > 0 && selectedGradeIds.length === grades.length} onChange={(e) => setSelectedGradeIds(e.target.checked ? grades.map(g => g.id) : [])} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                                <span>All grades</span>
                                            </label>
                                            {grades.map(g => (
                                                <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 16px', fontSize: '14px', fontWeight: '500' }}>
                                                    <input type="checkbox" checked={selectedGradeIds.includes(g.id)} onChange={(e) => { if (e.target.checked) setSelectedGradeIds([...selectedGradeIds, g.id]); else setSelectedGradeIds(selectedGradeIds.filter(id => id !== g.id)); }} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                                    <span>{g.name || `Grade ${g.id}`}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* User Type */}
                            <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', gap: '32px', padding: '0 24px', alignItems: 'center' }}>
                                {['Premium', 'Ultra'].map(u => (
                                    <label key={u} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={selectedUserTypes.includes(u)} onChange={(e) => { if (e.target.checked) setSelectedUserTypes([...selectedUserTypes, u]); else setSelectedUserTypes(selectedUserTypes.filter(ut => ut !== u)); }} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{u}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Mapping columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '16px', alignItems: 'center' }}>
                            {/* Unmapped */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>UnMapped <span style={{ fontSize: '18px', fontWeight: '600', color: '#64748b' }}>({unmappedSchools.length})</span></div>
                                <input type="text" placeholder="Search by school name..." value={unmappedSearch} onChange={(e) => setUnmappedSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} />
                                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '500px', background: '#f8fafc' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead><tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                                            <th style={{ padding: '12px', width: '40px' }}></th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>Name</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>School ID</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>Location</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>City</th>
                                        </tr></thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f1f5f9' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={unmappedSchools.length > 0 && selectedUnmappedIds.length === unmappedSchools.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedUnmappedIds(unmappedSchools.map(s => s.id));
                                                            } else {
                                                                setSelectedUnmappedIds([]);
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td colSpan="4" style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>All Schools</td>
                                            </tr>
                                            {unmappedSchools.filter(s => s.name.toLowerCase().includes(unmappedSearch.toLowerCase())).map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px' }}><input type="checkbox" checked={selectedUnmappedIds.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedUnmappedIds([...selectedUnmappedIds, s.id]); else setSelectedUnmappedIds(selectedUnmappedIds.filter(id => id !== s.id)); }} /></td>
                                                    <td style={{ padding: '12px', fontWeight: '600' }}>{s.name}</td>
                                                    <td style={{ padding: '12px', color: '#1e293b' }}>#{s.id}</td>
                                                    <td style={{ padding: '12px', color: '#1e293b' }}>{s.location || s.area || '—'}</td>
                                                    <td style={{ padding: '12px', color: '#1e293b' }}>{s.city || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Arrow button */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button onClick={() => { const toMove = unmappedSchools.filter(s => selectedUnmappedIds.includes(s.id)); setMappedSchools([...mappedSchools, ...toMove]); setUnmappedSchools(unmappedSchools.filter(s => !selectedUnmappedIds.includes(s.id))); setSelectedUnmappedIds([]); }} disabled={selectedUnmappedIds.length === 0} style={{ minWidth: '72px', height: '56px', padding: '8px 12px', background: selectedUnmappedIds.length > 0 ? '#2563eb' : '#bfdbfe', border: 'none', borderRadius: '6px', color: 'white', cursor: selectedUnmappedIds.length > 0 ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                    <ArrowRight size={18} />
                                    <span style={{ fontSize: '10px', fontWeight: '700' }}>Add</span>
                                    {selectedUnmappedIds.length > 0 && <span style={{ fontSize: '10px' }}>{selectedUnmappedIds.length}</span>}
                                </button>
                            </div>

                            {/* Mapped */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    Mapped <span style={{ fontSize: '18px', fontWeight: '600', color: '#64748b' }}>({mappedSchools.length})</span>
                                    <div style={{ flex: 1 }}></div>
                                    <button onClick={handleApplyMapping} disabled={mappingLoading} style={{ padding: '8px 16px', background: (mappedSchools.length > 0 && !mappingLoading) ? '#2563eb' : '#bfdbfe', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: (mappedSchools.length > 0 && !mappingLoading) ? 'pointer' : 'default' }}>
                                        {mappingLoading ? 'Processing...' : 'Apply Mapping'}
                                    </button>
                                </div>
                                <input type="text" placeholder="Search by school name..." value={mappedSearch} onChange={(e) => setMappedSearch(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} />
                                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '500px', background: '#f8fafc', position: 'relative' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead><tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                                            <th style={{ padding: '12px', width: '40px' }}></th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>Name</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>School ID</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>Location</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: '600' }}>City</th>
                                        </tr></thead>
                                        <tbody>
                                            {mappedSchools.length > 0 && (
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f1f5f9' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={mappedSchools.length > 0 && selectedMappedIds.length === mappedSchools.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedMappedIds(mappedSchools.map(s => s.id));
                                                                } else {
                                                                    setSelectedMappedIds([]);
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td colSpan="4" style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>All Schools</td>
                                                </tr>
                                            )}
                                            {mappedSchools.length === 0 ? (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', fontSize: '14px' }}>No Mapped Items</td></tr>
                                            ) : mappedSchools.filter(s => s.name.toLowerCase().includes(mappedSearch.toLowerCase())).map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px' }}><input type="checkbox" checked={selectedMappedIds.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedMappedIds([...selectedMappedIds, s.id]); else setSelectedMappedIds(selectedMappedIds.filter(id => id !== s.id)); }} /></td>
                                                    <td style={{ padding: '12px', fontWeight: '600' }}>{s.name}</td>
                                                    <td style={{ padding: '12px', color: '#1e293b' }}>#{s.id}</td>
                                                    <td style={{ padding: '12px', color: '#1e293b' }}>{s.location || s.area || '—'}</td>
                                                    <td style={{ padding: '12px', color: '#1e293b' }}>{s.city || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                                        <button onClick={() => { const toMove = mappedSchools.filter(s => selectedMappedIds.includes(s.id)); setUnmappedSchools([...unmappedSchools, ...toMove]); setMappedSchools(mappedSchools.filter(s => !selectedMappedIds.includes(s.id))); setSelectedMappedIds([]); }} disabled={selectedMappedIds.length === 0} style={{ padding: '8px 24px', background: selectedMappedIds.length > 0 ? '#2563eb' : '#bfdbfe', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: selectedMappedIds.length > 0 ? 'pointer' : 'default' }}>
                                            UnMap
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{ __html: `.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
            </div>
        </Layout>
    );
};

export default EditCoursePage;
