import { Router } from 'express';
import { createSchool, getSchools, updateSchool, deleteSchool } from '../controllers/schoolController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getSchools);
router.post('/', authorizeRole(['ADMIN']), createSchool);
router.put('/:id', authorizeRole(['ADMIN']), updateSchool);
router.delete('/:id', authorizeRole(['ADMIN']), deleteSchool);

export default router;
