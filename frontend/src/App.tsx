import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AssessmentSetup } from './pages/AssessmentSetup';
import { ScanUpload } from './pages/ScanUpload';
import { ScanProcessing } from './pages/ScanProcessing';
import { Verification } from './pages/Verification';
import { Gradebook } from './pages/Gradebook';

import { AIGradingAssistant } from './pages/AIGradingAssistant';
import { Settings } from './pages/Settings';
import { StudentList } from './pages/StudentList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assessments" element={<AssessmentSetup />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/ai-assistant" element={<AIGradingAssistant />} />
            <Route path="/scans" element={<ScanUpload />} />
            <Route path="/scans/processing/:id" element={<ScanProcessing />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/gradebook" element={<Gradebook />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
