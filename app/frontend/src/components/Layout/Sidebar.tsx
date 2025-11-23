import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, BookOpen, GraduationCap, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
    const { signOut, user } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        { path: '/dashboard', icon: Calendar, label: 'Horários' },
        { path: '/teachers', icon: Users, label: 'Professores' },
        { path: '/subjects', icon: BookOpen, label: 'Disciplinas' },
        { path: '/classes', icon: GraduationCap, label: 'Turmas' },
    ];

    if (user?.role === 'ADMIN') {
        menuItems.push({ path: '/admin', icon: Settings, label: 'Admin' });
    }

    return (
        <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold">School Scheduler</h1>
                <p className="text-xs text-gray-400 mt-1">Welcome, {user?.name}</p>
            </div>
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center p-3 rounded-lg transition-colors ${isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={signOut}
                    className="flex items-center w-full p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
