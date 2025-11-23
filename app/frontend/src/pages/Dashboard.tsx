import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Teachers</p>
                            <h3 className="text-2xl font-bold">--</h3>
                        </div>
                        <Users className="text-blue-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Subjects</p>
                            <h3 className="text-2xl font-bold">--</h3>
                        </div>
                        <BookOpen className="text-green-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Classes</p>
                            <h3 className="text-2xl font-bold">--</h3>
                        </div>
                        <GraduationCap className="text-purple-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Schedules Generated</p>
                            <h3 className="text-2xl font-bold">--</h3>
                        </div>
                        <Calendar className="text-yellow-500 w-8 h-8" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <Link to="/teachers" className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200">
                        Manage Teachers
                    </Link>
                    <Link to="/classes" className="bg-purple-100 text-purple-700 px-4 py-2 rounded hover:bg-purple-200">
                        Manage Classes
                    </Link>
                    <Link to="/schedule-generator" className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded hover:bg-yellow-200">
                        Generate Schedule
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
