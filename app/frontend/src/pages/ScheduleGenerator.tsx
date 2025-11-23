import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Schedule, Class } from '../types';
import { Calendar, RefreshCw } from 'lucide-react';

const ScheduleGenerator: React.FC = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchClasses();
        fetchSchedules();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
            if (response.data.length > 0) {
                setSelectedClassId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes', error);
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/schedules');
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules', error);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await api.post('/schedules/generate', { schoolId: 'default-school-id' }); // Should come from context
            await fetchSchedules();
            alert('Schedule generated successfully!');
        } catch (error) {
            console.error('Error generating schedule', error);
            alert('Failed to generate schedule');
        } finally {
            setGenerating(false);
        }
    };

    const filteredSchedules = schedules.filter(s => s.classId === selectedClassId);

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const slots = [1, 2, 3, 4, 5]; // Assuming 5 slots for now

    const getScheduleForSlot = (day: string, slot: number) => {
        return filteredSchedules.find(s => s.day === day && s.timeSlot === slot);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Schedule Generator</h1>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 disabled:opacity-50"
                >
                    {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                    {generating ? 'Generating...' : 'Generate New Schedule'}
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Select Class to View</label>
                <select
                    className="p-2 border rounded w-64"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                >
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border border-gray-200 px-4 py-2">Time Slot</th>
                            {days.map(day => (
                                <th key={day} className="border border-gray-200 px-4 py-2">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {slots.map(slot => (
                            <tr key={slot}>
                                <td className="border border-gray-200 px-4 py-2 font-bold text-center">{slot}º Aula</td>
                                {days.map(day => {
                                    const schedule = getScheduleForSlot(day, slot);
                                    return (
                                        <td key={`${day}-${slot}`} className="border border-gray-200 px-4 py-2 text-center h-24 relative">
                                            {schedule ? (
                                                <div className="absolute inset-0 p-2 flex flex-col justify-center items-center" style={{ backgroundColor: schedule.subject.color + '20' }}>
                                                    <span className="font-bold text-sm" style={{ color: schedule.subject.color }}>{schedule.subject.name}</span>
                                                    <span className="text-xs text-gray-600">{schedule.teacher.user.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduleGenerator;
