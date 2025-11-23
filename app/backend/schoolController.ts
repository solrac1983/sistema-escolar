import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createSchool = async (req: Request, res: Response) => {
    try {
        const { name, address, phone } = req.body;

        const school = await prisma.school.create({
            data: {
                name,
                address,
                phone,
            },
        });

        res.status(201).json(school);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating school' });
    }
};

export const getSchools = async (req: Request, res: Response) => {
    try {
        const schools = await prisma.school.findMany();
        res.json(schools);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schools' });
    }
};

export const updateSchool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, address, phone } = req.body;

        const school = await prisma.school.update({
            where: { id },
            data: { name, address, phone },
        });

        res.json(school);
    } catch (error) {
        res.status(500).json({ message: 'Error updating school' });
    }
};

export const deleteSchool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.school.delete({ where: { id } });
        res.json({ message: 'School deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting school' });
    }
};
