import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createSubject = async (req: Request, res: Response) => {
    try {
        const { name, code, color, description } = req.body;

        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                color,
                description,
            },
        });

        res.status(201).json(subject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating subject' });
    }
};

export const getSubjects = async (req: Request, res: Response) => {
    try {
        const subjects = await prisma.subject.findMany();
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects' });
    }
};

export const updateSubject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, color, description } = req.body;

        const subject = await prisma.subject.update({
            where: { id },
            data: { name, code, color, description },
        });

        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Error updating subject' });
    }
};

export const deleteSubject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.subject.delete({ where: { id } });
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subject' });
    }
};
