import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Subject } from '../types';
import { Plus, Edit, Trash } from 'lucide-react';

const Subjects: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/subjects');
            setSubjects(response.data);
        } catch (error) {
            console.error('Error fetching subjects', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Subjects</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: subject.color }}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{subject.name}</h3>
                                    <p className="text-sm text-gray-500">{subject.code}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="text-gray-400 hover:text-blue-600">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="text-gray-400 hover:text-red-600">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="mt-2 text-gray-600 text-sm">{subject.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Subjects;
