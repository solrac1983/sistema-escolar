import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createClass = async (req: Request, res: Response) => {
    try {
        const { name, shift, segment, dailyLessons, schoolId, subjects } = req.body;

        const newClass = await prisma.class.create({
            data: {
                name,
                shift,
                segment,
                dailyLessons,
                schoolId,
                subjects: {
                    create: subjects.map((s: any) => ({
                        subjectId: s.subjectId,
                        teacherId: s.teacherId,
                        lessonsPerWeek: s.lessonsPerWeek,
                    })),
                },
            },
            include: { subjects: true },
        });

        res.status(201).json(newClass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating class' });
    }
};

export const getClasses = async (req: Request, res: Response) => {
    try {
        const classes = await prisma.class.findMany({
            include: {
                subjects: {
                    include: { subject: true, teacher: { include: { user: true } } },
                },
            },
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching classes' });
    }
};

export const updateClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, shift, segment, dailyLessons, subjects } = req.body;

        // Update class details
        await prisma.class.update({
            where: { id },
            data: { name, shift, segment, dailyLessons },
        });

        // Update subjects (simplified: delete all and recreate)
        if (subjects) {
            await prisma.classSubject.deleteMany({ where: { classId: id } });
            await prisma.classSubject.createMany({
                data: subjects.map((s: any) => ({
                    classId: id,
                    subjectId: s.subjectId,
                    teacherId: s.teacherId,
                    lessonsPerWeek: s.lessonsPerWeek,
                })),
            });
        }

        const updatedClass = await prisma.class.findUnique({
            where: { id },
            include: { subjects: true },
        });

        res.json(updatedClass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating class' });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.class.delete({ where: { id } });
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting class' });
    }
};
