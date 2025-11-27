import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember } from '../controllers/projectController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['admin']), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', authorizeRole(['admin']), updateProject);
router.delete('/:id', authorizeRole(['admin']), deleteProject);
router.post('/:id/members', authorizeRole(['admin']), addMember);

export default router;
