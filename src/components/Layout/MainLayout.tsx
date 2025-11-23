import React from 'react';
import Sidebar from './Sidebar';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                {children}
            </div>
        </div>
    );
};

export default MainLayout;
