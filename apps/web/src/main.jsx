/**
 * KUNEO WEB ADMIN - ENTRY POINT
 * Content management system for Kuneo modules
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Pages
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ModulesPage from './pages/ModulesPage.jsx'
import UploadPage from './pages/UploadPage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<LoginPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="upload" element={<UploadPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
