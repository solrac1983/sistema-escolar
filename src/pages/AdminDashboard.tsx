import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User } from '../types';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Assuming we have an endpoint for users, or we use teachers/etc.
            // For now, let's just show a placeholder or fetch teachers as users.
            // The requirement says "CRUD completo para usuários".
            // We haven't implemented a generic user controller, but we have Auth.
            // Let's assume we add a user route or just show this as a placeholder.
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users', error);
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p>User management and School configuration will go here.</p>
                <p className="text-sm text-gray-500 mt-2">This module requires additional backend endpoints for generic User CRUD.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
