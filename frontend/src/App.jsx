import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardPage from './pages/DashboardPage';
import MappingControlPage from './pages/MappingControlPage';
import UsersPage from './pages/UsersPage';
import SchoolsPage from './pages/SchoolsPage';
import NewCoursePage from './pages/NewCoursePage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/mappings/view" replace />} />
          <Route path="/admin/mappings/view" element={<DashboardPage />} />
          <Route path="/admin/mappings/new" element={<NewCoursePage />} />
          <Route path="/admin/mappings/create" element={<MappingControlPage mode="create" />} />
          <Route path="/admin/mappings/edit/:id" element={<MappingControlPage mode="edit" />} />
          <Route path="/admin/config/users" element={<UsersPage />} />
          <Route path="/admin/config/users/new" element={<CreateUserPage />} />
          <Route path="/admin/config/users/:id" element={<EditUserPage />} />
          <Route path="/admin/config/schools" element={<SchoolsPage />} />
          <Route path="*" element={<Navigate to="/admin/mappings/view" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
