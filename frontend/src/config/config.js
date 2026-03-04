// src/config/config.js

const getEnv = (key, defaultValue = null) => {
    return import.meta.env[key] || defaultValue;
};

const XANO_BASE_URL = getEnv('VITE_XANO_BASE_URL');
const XANO_COURSES_BASE_URL = getEnv('VITE_XANO_COURSES_BASE_URL') || XANO_BASE_URL;
const XANO_MEMBERS_BASE_URL = getEnv('VITE_XANO_MEMBERS_BASE_URL') || XANO_BASE_URL;
const XANO_API_KEY = getEnv('VITE_XANO_API_KEY');

const endpoints = {
    members: {
        getAllUsers: `${XANO_MEMBERS_BASE_URL}/get_all_users`,
        getAllGrades: `${XANO_MEMBERS_BASE_URL}/get_all_grades`,
        getAllSchools: `${XANO_MEMBERS_BASE_URL}/get_all_schools`,
        countUsers: `${XANO_MEMBERS_BASE_URL}/get_all_users`,
        updateUser: (id) => `${XANO_MEMBERS_BASE_URL}/user/${id}`,
    },
    courses: {
        getAllCourses: `${XANO_COURSES_BASE_URL}/get_all_courses`,
        getAllWorkshops: `${XANO_COURSES_BASE_URL}/get_workshops`,
        getAllBooks: `${XANO_COURSES_BASE_URL}/get_all_books`,
        getAllByteCategories: `${XANO_COURSES_BASE_URL}/get_all_byte_categories`,
        getAllCategories: `${XANO_COURSES_BASE_URL}/get_all_categories`,
        upsertEntitlement: `${XANO_COURSES_BASE_URL}/upsert_entitlement`,
        getMappings: `${XANO_COURSES_BASE_URL}/get_all_entitlements`,
        getMapping: (id) => `${XANO_COURSES_BASE_URL}/get_all_entitlements/${id}`,
        updateMapping: (id) => `${XANO_COURSES_BASE_URL}/upsert_entitlement/${id}`,
        deleteMapping: (id) => `${XANO_COURSES_BASE_URL}/upsert_entitlement/${id}`,
        syncCourse: `${XANO_COURSES_BASE_URL}/sync_course`,
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
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            ...(XANO_API_KEY && { 'Authorization': `Bearer ${XANO_API_KEY}` }),
        },
    }
};

export default config;
