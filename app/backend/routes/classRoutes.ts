import { Router } from 'express';
import { createClass, getClasses, updateClass, deleteClass } from '../controllers/classController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getClasses);
router.post('/', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), createClass);
router.put('/:id', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), updateClass);
router.delete('/:id', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), deleteClass);

export default router;
