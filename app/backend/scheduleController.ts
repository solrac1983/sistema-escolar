import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Helper types
interface TimeSlot {
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
    slot: number; // 1 to 5 (or more)
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;

export const generateSchedule = async (req: Request, res: Response) => {
    try {
        const { schoolId } = req.body;

        // 1. Fetch all necessary data
        const classes = await prisma.class.findMany({
            where: { schoolId },
            include: { subjects: true },
        });

        const teachers = await prisma.teacher.findMany({
            include: { availability: true },
        });

        // Map teacher availability for quick lookup
        // teacherId -> day -> shift -> boolean
        const teacherAvailabilityMap = new Map<string, Map<string, Set<string>>>();
        teachers.forEach(t => {
            const dayMap = new Map<string, Set<string>>();
            t.availability.forEach(a => {
                if (a.isAvailable) {
                    if (!dayMap.has(a.day)) dayMap.set(a.day, new Set());
                    dayMap.get(a.day)?.add(a.shift);
                }
            });
            teacherAvailabilityMap.set(t.id, dayMap);
        });

        // Existing schedules (to avoid conflicts if we are adding to existing)
        // For now, let's assume we wipe and regenerate or just check conflicts.
        // Requirement: "Gerador automático de horários com IA" (We'll use a heuristic algorithm)

        const generatedSchedules: any[] = [];
        const globalTeacherSchedule = new Map<string, Set<string>>(); // teacherId -> "day-slot"

        // Helper to check if teacher is free
        const isTeacherFree = (teacherId: string, day: string, slot: number, shift: string) => {
            // Check general availability
            const availableShifts = teacherAvailabilityMap.get(teacherId)?.get(day);
            if (!availableShifts || !availableShifts.has(shift)) return false;

            // Check if already booked
            const key = `${day}-${slot}`;
            if (globalTeacherSchedule.get(teacherId)?.has(key)) return false;

            return true;
        };

        // Helper to book teacher
        const bookTeacher = (teacherId: string, day: string, slot: number) => {
            if (!globalTeacherSchedule.has(teacherId)) {
                globalTeacherSchedule.set(teacherId, new Set());
            }
            globalTeacherSchedule.get(teacherId)?.add(`${day}-${slot}`);
        };

        // 2. Algorithm
        // Iterate over classes
        for (const cls of classes) {
            const classSchedule = new Set<string>(); // "day-slot"
            const dailyLessonCount = cls.dailyLessons;

            // Sort subjects by lessons per week (descending) to prioritize heavy subjects
            const subjects = [...cls.subjects].sort((a, b) => b.lessonsPerWeek - a.lessonsPerWeek);

            for (const subj of subjects) {
                let lessonsNeeded = subj.lessonsPerWeek;
                let teacherId = subj.teacherId;

                if (!teacherId) continue; // Cannot schedule without teacher

                // Try to distribute lessons across days
                // Simple strategy: Try to place 1 lesson per day first, then fill up
                let daysWithLesson = new Set<string>();

                for (let i = 0; i < lessonsNeeded; i++) {
                    let placed = false;

                    // Try each day
                    for (const day of DAYS) {
                        // Heuristic: Try to avoid multiple lessons of same subject per day unless necessary
                        if (daysWithLesson.has(day) && lessonsNeeded <= 5) {
                            // If we have few lessons, spread them. If many, we might need to double up.
                            // For simplicity, let's try to find another day first.
                            // But if we loop through all days and can't place, we might need to relax this.
                            // Let's just try to find a slot.
                        }

                        // Try slots
                        for (let slot = 1; slot <= dailyLessonCount; slot++) {
                            const slotKey = `${day}-${slot}`;

                            // Check class availability
                            if (classSchedule.has(slotKey)) continue;

                            // Check teacher availability
                            if (isTeacherFree(teacherId, day, slot, cls.shift)) {
                                // Book it
                                generatedSchedules.push({
                                    classId: cls.id,
                                    subjectId: subj.subjectId,
                                    teacherId: teacherId,
                                    day,
                                    timeSlot: slot,
                                });
                                classSchedule.add(slotKey);
                                bookTeacher(teacherId, day, slot);
                                daysWithLesson.add(day);
                                placed = true;
                                break; // Next lesson
                            }
                        }
                        if (placed) break;
                    }

                    if (!placed) {
                        console.warn(`Could not place lesson for class ${cls.name}, subject ${subj.subjectId}`);
                    }
                }
            }
        }

        // 3. Save to DB
        // Transactional delete and create
        await prisma.$transaction(async (prisma) => {
            // Clear existing schedules for these classes?
            // For now, let's assume we are generating fresh.
            // Ideally we should delete schedules for the school or specific classes.
            // await prisma.schedule.deleteMany({ where: { class: { schoolId } } }); 
            // Let's just return the generated schedule for preview first?
            // Requirement: "Visualização em grid dos horários gerados" -> "Opção de ajustes manuais pós-geração"
            // So maybe we save them or just return them.
            // Let's save them.

            // Delete existing for these classes
            for (const cls of classes) {
                await prisma.schedule.deleteMany({ where: { classId: cls.id } });
            }

            await prisma.schedule.createMany({
                data: generatedSchedules,
            });
        });

        res.json({ message: 'Schedule generated successfully', count: generatedSchedules.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating schedule' });
    }
};

export const getSchedules = async (req: Request, res: Response) => {
    try {
        const { schoolId, classId, teacherId } = req.query;

        const where: any = {};
        if (classId) where.classId = String(classId);
        if (teacherId) where.teacherId = String(teacherId);
        // if (schoolId) ... need to join with class

        const schedules = await prisma.schedule.findMany({
            where,
            include: {
                class: true,
                subject: true,
                teacher: { include: { user: true } },
            },
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedules' });
    }
};
