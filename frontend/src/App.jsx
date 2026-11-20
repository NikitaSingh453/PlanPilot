import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Team from './pages/Team';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute><Layout><Team /></Layout></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
