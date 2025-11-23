import { Router } from 'express';
import { createSubject, getSubjects, updateSubject, deleteSubject } from '../controllers/subjectController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getSubjects);
router.post('/', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), createSubject);
router.put('/:id', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), updateSubject);
router.delete('/:id', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), deleteSubject);

export default router;
