// src/services/api.js - REFACTORED FOR CUSTOM CMS ARCHITECTURE
import client from '../api/client';
import config from '../config/config';

const { members, courses } = config.endpoints;

// Sort grades by level_number, then by numeric part of name, then by id (Grade 1, 2, … 12)
function sortGradesAscending(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return arr;
    return [...arr].sort((a, b) => {
        const numA = a.level_number != null ? Number(a.level_number) : parseInt(String(a.name || '').replace(/\D/g, ''), 10) || Number(a.id) || 0;
        const numB = b.level_number != null ? Number(b.level_number) : parseInt(String(b.name || '').replace(/\D/g, ''), 10) || Number(b.id) || 0;
        return numA - numB;
    });
}

// User & Filter Endpoints (Members Base)
export const getGrades = async () => {
    const res = await client.get(members.getAllGrades);
    const list = Array.isArray(res) ? res : (res?.data ?? res?.items ?? res?.records ?? []);
    return sortGradesAscending(list);
};
export const getSchools = () => client.get(members.getAllSchools);
export const getUsers = () => client.get(members.getAllUsers);
export const updateUser = (id, data) => client.post(members.updateUser(id), data);
export const deleteUser = async (id) => {
    const response = await fetch(members.deleteStudent, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Delete failed');
    }
    return response.json();
};
export const updateStudent = (data) => client.post(members.updateStudent, data);
export const deleteStudent = (id) => client.post(members.deleteStudent, { student_id: id });
export const getUserCount = (params) => client.get(members.countUsers, params);
export const createStudent = (data) => client.post(members.createStudent, data);

// Asset Endpoints (Courses Base)
export const getCourses = () => client.get(courses.getAllCourses);
export const getWorkshops = () => client.get(courses.getAllWorkshops);
export const getBooks = () => client.get(courses.getAllBooks);
export const getByteCategories = () => client.get(courses.getAllByteCategories);
export const getCategories = () => client.get(courses.getAllCategories);

// Mapping CRUD (Courses Base)
export const getMappings = (params) => client.get(courses.getMappings, params);
export const getMappingById = (id) => client.get(courses.getMapping(id));
export const createMapping = (data) => client.patch(courses.upsertEntitlement, data);
export const updateMapping = (id, data) => client.patch(courses.upsertEntitlement, data);
export const deleteMapping = (id) => client.delete(courses.deleteMapping(id));

// Course Creation Flow (Courses Base)
export const createCourse = (data) => client.post(courses.createCourse, data);
export const addChapter = (data) => client.post(courses.addChapter, data);
export const createQuiz = (data) => client.post(courses.createQuiz, data);
export const updateChapter = (id, data) => client.patch(`${courses.updateChapter}/${id}`, data);
export const deleteChapter = (id) => client.delete(`${courses.deleteChapter}/${id}`);
export const updateQuiz = (id, data) => client.patch(`${courses.updateQuiz}/${id}`, data);
export const deleteQuiz = (id) => client.delete(`${courses.deleteQuiz}/${id}`);
export const updateChapterOrder = (data) => client.patch(courses.updateChapterOrder, data);
export const updateCourseVisibility = (data) => client.post(courses.updateCourseVisibility, data);
export const publishCourse = (data) => client.post(courses.updateCourseVisibility, data);

// Default export as courses base (legacy compatibility)
export default {
    get: (url, params) => client.get(`${config.xano.coursesBaseUrl}${url}`, params),
    post: (url, data) => client.post(`${config.xano.coursesBaseUrl}${url}`, data),
    patch: (url, data) => client.patch(`${config.xano.coursesBaseUrl}${url}`, data),
    delete: (url) => client.delete(`${config.xano.coursesBaseUrl}${url}`),
};
