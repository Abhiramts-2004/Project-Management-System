import express from 'express';
import { createTask, getTasksByProject, updateTask, updateTaskStatus, addComment, getMyTasks, deleteTask, getAllTasks } from '../controllers/taskController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, createTask);
router.get('/my-tasks', authenticateToken, getMyTasks);
router.get('/project/:id', authenticateToken, getTasksByProject);
router.put('/:id', authenticateToken, updateTask);
router.delete('/:id', authenticateToken, deleteTask);
router.patch('/:id/status', authenticateToken, updateTaskStatus);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/', authenticateToken, authorizeRole(['admin', 'tester']), getAllTasks);

export default router;
