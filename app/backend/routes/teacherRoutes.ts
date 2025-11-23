import { Router } from 'express';
import { createTeacher, getTeachers, updateTeacher, deleteTeacher } from '../controllers/teacherController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getTeachers);
router.post('/', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), createTeacher);
router.put('/:id', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), updateTeacher);
router.delete('/:id', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), deleteTeacher);

export default router;
