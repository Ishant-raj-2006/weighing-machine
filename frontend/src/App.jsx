import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Toaster } from 'sonner'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Instruments from './pages/Instruments'
import NewInstrument from './pages/NewInstrument'
import NewTest from './pages/NewTest'
import TestObservations from './pages/TestObservations'
import ReportPreview from './pages/ReportPreview'
import ReportHistory from './pages/ReportHistory'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors theme="light" />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/instruments/new" element={<NewInstrument />} />
          <Route path="/tests/new" element={<NewTest />} />
          <Route path="/tests/:id/observations" element={<TestObservations />} />
          <Route path="/tests/:id/result" element={<ReportPreview />} />
          <Route path="/reports" element={<ReportHistory />} />
          <Route
            path="/admin"
            element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
