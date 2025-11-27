import express from 'express';
import { getUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.patch('/:id', updateUser);
router.delete('/:id', authorizeRole(['admin']), deleteUser);

export default router;
