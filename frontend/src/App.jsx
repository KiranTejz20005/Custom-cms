import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardPage from './pages/DashboardPage';
import MappingControlPage from './pages/MappingControlPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/mappings/view" replace />} />
          <Route path="/admin/mappings/view" element={<DashboardPage />} />
          <Route path="/admin/mappings/create" element={<MappingControlPage mode="create" />} />
          <Route path="/admin/mappings/edit/:id" element={<MappingControlPage mode="edit" />} />
          <Route path="*" element={<Navigate to="/admin/mappings/view" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
