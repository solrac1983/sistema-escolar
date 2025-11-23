import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createTeacher = async (req: Request, res: Response) => {
    try {
        const { name, email, qualifications, subjects, availability } = req.body;

        // Check if user exists or create one (simplified for now, ideally user is created first)
        // For this flow, we assume we might be creating a user and teacher together or linking to existing user.
        // Let's assume we create a user with a default password if not provided, or just link.
        // Requirement says: "Botão 'Cadastrar Novo Professor'".
        // We'll create a User with role TEACHER and then the Teacher profile.

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: '$2b$10$EpRnTzVlqHNP0.fkb//PnO.zM.K.m1.p.t.q.r.s.u.v.w.x.y.z', // Default password or generated
                    role: 'TEACHER',
                },
            });

            const teacher = await prisma.teacher.create({
                data: {
                    userId: user.id,
                    qualifications,
                    subjects: {
                        connect: subjects.map((id: string) => ({ id })),
                    },
                },
            });

            if (availability && availability.length > 0) {
                await prisma.teacherAvailability.createMany({
                    data: availability.map((a: any) => ({
                        teacherId: teacher.id,
                        day: a.day,
                        shift: a.shift,
                        isAvailable: true,
                    })),
                });
            }

            return teacher;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating teacher' });
    }
};

export const getTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await prisma.teacher.findMany({
            include: {
                user: true,
                subjects: true,
                availability: true,
            },
        });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teachers' });
    }
};

export const updateTeacher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, qualifications, subjects, availability } = req.body;

        const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        await prisma.$transaction(async (prisma) => {
            await prisma.user.update({
                where: { id: teacher.userId },
                data: { name, email },
            });

            await prisma.teacher.update({
                where: { id },
                data: {
                    qualifications,
                    subjects: {
                        set: [], // Clear existing
                        connect: subjects.map((sid: string) => ({ id: sid })),
                    },
                },
            });

            if (availability) {
                // Simplified: delete all and recreate
                await prisma.teacherAvailability.deleteMany({ where: { teacherId: id } });
                await prisma.teacherAvailability.createMany({
                    data: availability.map((a: any) => ({
                        teacherId: id,
                        day: a.day,
                        shift: a.shift,
                        isAvailable: true,
                    })),
                });
            }
        });

        res.json({ message: 'Teacher updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating teacher' });
    }
};

export const deleteTeacher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Note: This might fail if there are foreign key constraints (schedules, etc.)
        // We should handle cascading or soft deletes. For now, hard delete.
        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        await prisma.user.delete({ where: { id: teacher.userId } }); // Cascade delete teacher? No, Prisma schema needs cascade.
        // In schema: Teacher has relation to User. If User is deleted, Teacher might be deleted if configured.
        // But here we delete User.
        // Let's just delete Teacher first then User.
        await prisma.teacher.delete({ where: { id } });
        await prisma.user.delete({ where: { id: teacher.userId } });

        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting teacher' });
    }
};
