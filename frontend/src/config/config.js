// src/config/config.js

const getEnv = (key, defaultValue = null) => {
    return import.meta.env[key] || defaultValue;
};

const DEFAULT_XANO_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';

const XANO_BASE_URL = getEnv('VITE_XANO_BASE_URL', DEFAULT_XANO_BASE_URL);
const XANO_COURSES_BASE_URL = getEnv('VITE_XANO_COURSES_BASE_URL', DEFAULT_XANO_BASE_URL) || XANO_BASE_URL;
const XANO_MEMBERS_BASE_URL = getEnv('VITE_XANO_MEMBERS_BASE_URL') || XANO_BASE_URL;
const XANO_API_KEY = getEnv('VITE_XANO_API_KEY');
const RAW_HTTP_TIMEOUT = Number(getEnv('VITE_HTTP_TIMEOUT_MS', 30000));
const HTTP_TIMEOUT_MS = Number.isFinite(RAW_HTTP_TIMEOUT) && RAW_HTTP_TIMEOUT > 0 ? RAW_HTTP_TIMEOUT : 30000;

const endpoints = {
    members: {
        getAllUsers: `${XANO_MEMBERS_BASE_URL}/get_all_users`,
        getAllGrades: `${XANO_MEMBERS_BASE_URL}/get_all_grades`,
        getAllSchools: `${XANO_MEMBERS_BASE_URL}/get_all_schools`,
        countUsers: `${XANO_MEMBERS_BASE_URL}/get_all_users`,
        updateUser: (id) => `${XANO_MEMBERS_BASE_URL}/user/${id}`,
        deleteUser: (id) => `${XANO_MEMBERS_BASE_URL}/user/${id}`,
        updateStudent: `${XANO_MEMBERS_BASE_URL}/update_student`,
        deleteStudent: `${XANO_MEMBERS_BASE_URL}/delete_student`,
        createStudent: `${XANO_MEMBERS_BASE_URL}/create_student`,
    },
    courses: {
        getAllCourses: `${XANO_COURSES_BASE_URL}/get_all_courses`,
        getAllWorkshops: `${XANO_COURSES_BASE_URL}/get_workshops`,
        getAllBooks: `${XANO_COURSES_BASE_URL}/get_all_books`,
        getAllByteCategories: `${XANO_COURSES_BASE_URL}/get_all_byte_categories`,
        getAllCategories: `${XANO_COURSES_BASE_URL}/get_all_categories`,
        upsertEntitlement: `${XANO_COURSES_BASE_URL}/upsert_entitlement`,
        getMappings: `${XANO_COURSES_BASE_URL}/get_entitlements`,
        getMapping: (id) => `${XANO_COURSES_BASE_URL}/get_entitlements/${id}`,
        updateMapping: () => `${XANO_COURSES_BASE_URL}/upsert_entitlement`,
        deleteMapping: (id) => `${XANO_COURSES_BASE_URL}/upsert_entitlement/${id}`,
        syncCourse: `${XANO_COURSES_BASE_URL}/sync_course`,
        // New Course Flow Endpoints
        createCourse: `${XANO_COURSES_BASE_URL}/create_course`,
        addChapter: `${XANO_COURSES_BASE_URL}/add_chapter`,
        createQuiz: `${XANO_COURSES_BASE_URL}/create_quiz`,
        updateChapter: `${XANO_COURSES_BASE_URL}/add_chapter`,
        deleteChapter: `${XANO_COURSES_BASE_URL}/add_chapter`,
        updateQuiz: `${XANO_COURSES_BASE_URL}/update_quiz`,
        deleteQuiz: `${XANO_COURSES_BASE_URL}/create_quiz`,
        updateChapterOrder: `${XANO_COURSES_BASE_URL}/update_chapter_sequence`, // FIXED: was update_chapter_order
        updateCourseVisibility: `${XANO_COURSES_BASE_URL}/update_course_visibility`,
        publishCourse: `${XANO_COURSES_BASE_URL}/update_course_visibility`,
    },
};

const config = {
    xano: {
        baseUrl: XANO_BASE_URL,
        coursesBaseUrl: XANO_COURSES_BASE_URL,
        membersBaseUrl: XANO_MEMBERS_BASE_URL,
        apiKey: XANO_API_KEY,
    },
    endpoints,
    http: {
        timeout: HTTP_TIMEOUT_MS,
        headers: {
            'Content-Type': 'application/json',
            ...(XANO_API_KEY && { 'Authorization': `Bearer ${XANO_API_KEY}` }),
        },
    }
};

export default config;