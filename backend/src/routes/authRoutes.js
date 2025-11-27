import express from 'express';
import { login, refreshToken, createUser } from '../controllers/authController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/create-user', authenticateToken, authorizeRole(['admin']), createUser);

export default router;
