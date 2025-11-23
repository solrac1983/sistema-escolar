import { Router } from 'express';
import { generateSchedule, getSchedules } from '../controllers/scheduleController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getSchedules);
router.post('/generate', authorizeRole(['ADMIN', 'DIRECTOR', 'COORDINATOR']), generateSchedule);

export default router;
