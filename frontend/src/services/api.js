// src/services/api.js - REFACTORED FOR CUSTOM CMS ARCHITECTURE
import client from '../api/client';
import config from '../config/config';

const { members, courses } = config.endpoints;

// User & Filter Endpoints (Members Base)
export const getGrades = () => client.get(members.getAllGrades);
export const getSchools = () => client.get(members.getAllSchools);
export const getUsers = () => client.get(members.getAllUsers);
export const getUserCount = (params) => client.get(members.countUsers, params);

// Asset Endpoints (Courses Base)
export const getCourses = () => client.get(courses.getAllCourses);
export const getWorkshops = () => client.get(courses.getAllWorkshops);
export const getBooks = () => client.get(courses.getAllBooks);
export const getByteCategories = () => client.get(courses.getAllByteCategories);
export const getCategories = () => client.get(courses.getAllCategories);

// Mapping CRUD (Courses Base)
export const getMappings = (params) => client.get(courses.getMappings, params);
export const getMappingById = (id) => client.get(courses.getMapping(id));
export const createMapping = (data) => client.post(courses.upsertEntitlement, data);
export const updateMapping = (id, data) => client.patch(courses.updateMapping(id), data);
export const deleteMapping = (id) => client.delete(courses.deleteMapping(id));

// Default export as courses base (legacy compatibility)
export default {
    get: (url, params) => client.get(`${config.xano.coursesBaseUrl}${url}`, params),
    post: (url, data) => client.post(`${config.xano.coursesBaseUrl}${url}`, data),
    patch: (url, data) => client.patch(`${config.xano.coursesBaseUrl}${url}`, data),
    delete: (url) => client.delete(`${config.xano.coursesBaseUrl}${url}`),
};
