import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import teacherRoutes from './routes/teacherRoutes';
import subjectRoutes from './routes/subjectRoutes';
import classRoutes from './routes/classRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import schoolRoutes from './routes/schoolRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/schools', schoolRoutes);

app.get('/', (req, res) => {
    res.send('School Scheduler API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
