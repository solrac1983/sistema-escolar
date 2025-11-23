import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import ScheduleGenerator from './pages/ScheduleGenerator';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signed, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!signed) {
        return <Navigate to="/login" />;
    }

    return <MainLayout>{children}</MainLayout>;
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/teachers"
                        element={
                            <PrivateRoute>
                                <Teachers />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/subjects"
                        element={
                            <PrivateRoute>
                                <Subjects />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/classes"
                        element={
                            <PrivateRoute>
                                <Classes />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/schedule-generator"
                        element={
                            <PrivateRoute>
                                <ScheduleGenerator />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute>
                                <AdminDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
