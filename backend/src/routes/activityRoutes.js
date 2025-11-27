import express from 'express';
import { getActivityLogs } from '../controllers/activityController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRole(['admin']), getActivityLogs);

export default router;
