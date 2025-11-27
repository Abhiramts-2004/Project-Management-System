import { query } from '../db/db.js';

export const createProject = async (req, res) => {
  const { name, description, start_date, end_date } = req.body;

  try {
    const result = await query(
      'INSERT INTO projects (name, description, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, start_date, end_date, req.user.id]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'created_project', 'project', result.rows[0].id, JSON.stringify({ name })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    let text = 'SELECT p.*, u.username as created_by_name FROM projects p LEFT JOIN users u ON p.created_by = u.id';
    const params = [];

    // If employee, only show assigned projects
    if (req.user.role === 'employee') {
      text = `
        SELECT p.*, u.username as created_by_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1
      `;
      params.push(req.user.id);
    }

    const result = await query(text, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const projectResult = await query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    const membersResult = await query(
      'SELECT u.id, u.username, u.avatar_url FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1',
      [id]
    );

    res.json({ ...projectResult.rows[0], members: membersResult.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status, start_date, end_date } = req.body;

  try {
    const result = await query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description, status, start_date, end_date, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'updated_project', 'project', id, JSON.stringify({ name, status })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'deleted_project', 'project', id]
    );

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addMember = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    await query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, user_id]);
    
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'added_member', 'project', id, JSON.stringify({ user_id })]
    );

    res.json({ message: 'Member added' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
