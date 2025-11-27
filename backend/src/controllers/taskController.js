import { query } from '../db/db.js';

export const createTask = async (req, res) => {
  const { title, description, priority, project_id, assigned_to, due_date } = req.body;
  // assigned_to is now expected to be an array of user IDs

  try {
    const result = await query(
      'INSERT INTO tasks (title, description, priority, project_id, due_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, priority, project_id, due_date, req.user.id]
    );

    const taskId = result.rows[0].id;

    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const userId of assigned_to) {
        await query(
          'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
          [taskId, userId]
        );
      }
    } else if (assigned_to && typeof assigned_to === 'string') {
        // Handle single assignee for backward compatibility or if frontend sends single ID
        await query(
            'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
            [taskId, assigned_to]
        );
        // Add to project members
        await query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [project_id, assigned_to]);
    }

    // Add multiple assignees to project members
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const userId of assigned_to) {
        await query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [project_id, userId]);
      }
    }

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'created_task', 'task', taskId, JSON.stringify({ title, project_id })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  const { id } = req.params; // project_id
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log(`Fetching tasks for project ${id}, User: ${userId}, Role: ${userRole}`);

  try {
    let queryText = `SELECT t.*, 
        c.username as created_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'username', u.username,
              'avatar_url', u.avatar_url
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as assignees
       FROM tasks t 
       LEFT JOIN users c ON t.created_by = c.id
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE t.project_id = $1`;
    
    const queryParams = [id];

    if (userRole === 'employee') {
      console.log('Applying employee filter');
      queryText += ` AND EXISTS (
        SELECT 1 FROM task_assignees ta_check 
        WHERE ta_check.task_id = t.id AND ta_check.user_id = $2
      )`;
      queryParams.push(userId);
    }
    // Testers and Admins see all tasks

    queryText += ` GROUP BY t.id, c.username
       ORDER BY t.position ASC, t.created_at DESC`;

    const result = await query(queryText, queryParams);
    console.log(`Found ${result.rows.length} tasks`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getTasksByProject:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, assigned_to, due_date } = req.body;

  // Strict check: Only admins can update task details
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can edit task details.' });
  }

  try {
    const result = await query(
      'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), priority = COALESCE($3, priority), due_date = COALESCE($4, due_date), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [title, description, priority, due_date, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

    if (assigned_to !== undefined) {
      // Clear existing assignees
      await query('DELETE FROM task_assignees WHERE task_id = $1', [id]);

      // Add new assignees
      if (Array.isArray(assigned_to) && assigned_to.length > 0) {
        for (const userId of assigned_to) {
          await query(
            'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
            [id, userId]
          );
        }
      } else if (typeof assigned_to === 'string' && assigned_to) {
          await query(
              'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
              [id, assigned_to]
          );
      }
    }

    // Add new assignees to project members
    if (assigned_to !== undefined) {
        const projectResult = await query('SELECT project_id FROM tasks WHERE id = $1', [id]);
        const projectId = projectResult.rows[0]?.project_id;

        if (projectId) {
            if (Array.isArray(assigned_to) && assigned_to.length > 0) {
                for (const userId of assigned_to) {
                    await query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [projectId, userId]);
                }
            } else if (typeof assigned_to === 'string' && assigned_to) {
                await query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [projectId, assigned_to]);
            }
        }
    }

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'updated_task', 'task', id, JSON.stringify({ title })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status, position } = req.body;
  const userRole = req.user.role;

  try {
    // Fetch current task status
    const currentTaskResult = await query('SELECT status FROM tasks WHERE id = $1', [id]);
    if (currentTaskResult.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const currentStatus = currentTaskResult.rows[0].status;

    // Enforce Workflow Rules
    // Enforce Workflow Rules
    if (userRole === 'employee') {
      // Check if user is assigned to the task
      const assigneeResult = await query(
        'SELECT 1 FROM task_assignees WHERE task_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (assigneeResult.rows.length === 0) {
        return res.status(403).json({ message: 'You can only move tasks assigned to you.' });
      }

      // Employee Rules:
      // 1. Cannot move backwards
      // 2. Cannot move from 'review' to 'done' (only admin can approve)
      // 3. Cannot move from 'done' to anything else (once done, it's done)
      
      const validTransitions = {
        'todo': ['in-progress'],
        'in-progress': ['review'],
        'review': [], // Employee cannot move out of review
        'done': []    // Employee cannot move out of done
      };

      // Allow re-ordering within the same column
      if (status !== currentStatus) {
         if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
             return res.status(403).json({ 
                 message: `Employees cannot move tasks from '${currentStatus}' to '${status}'.` 
             });
         }
      }
    } else if (userRole === 'tester') {
        // Tester Rules:
        // 1. Can move from 'review' to 'done' (Approve)
        // 2. Can move from 'review' to 'in-progress' (Reject)
        // 3. Cannot move anything else
        
        if (currentStatus !== 'review') {
            return res.status(403).json({ message: 'Testers can only move tasks that are in "Review".' });
        }

        const validTesterTransitions = ['done', 'in-progress'];
        if (!validTesterTransitions.includes(status)) {
            return res.status(403).json({ message: 'Testers can only move tasks to "Done" (Approve) or "In Progress" (Reject).' });
        }

    } else {
        // Admin Rules:
        // 1. Can move from 'review' to 'done' (Approve)
        // 2. Can move from 'review' to 'in-progress' (Reject)
        // 3. Can generally do anything, but let's keep it sane. 
        // For now, we allow admins to do anything to fix mistakes.
    }

    const result = await query(
      'UPDATE tasks SET status = $1, position = COALESCE($2, position), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, position, id]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'moved_task', 'task', id, JSON.stringify({ status, position, previous_status: currentStatus })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const result = await query(
      'INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, req.user.id, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    let queryText;
    let queryParams;

    if (req.user.role === 'tester') {
      // For testers, "My Tasks" are tasks in review
      queryText = `
        SELECT t.*, 
        p.name as project_name,
        c.username as created_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'username', u.username,
              'avatar_url', u.avatar_url
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as assignees
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users c ON t.created_by = c.id
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE t.status = 'review'
       GROUP BY t.id, p.name, c.username
       ORDER BY t.updated_at DESC
      `;
      queryParams = [];
    } else {
      // For employees, "My Tasks" are assigned tasks
      queryText = `
        SELECT t.*, 
        p.name as project_name,
        c.username as created_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'username', u.username,
              'avatar_url', u.avatar_url
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) as assignees
       FROM tasks t
       JOIN task_assignees ta_me ON t.id = ta_me.task_id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users c ON t.created_by = c.id
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE ta_me.user_id = $1
       GROUP BY t.id, p.name, c.username
       ORDER BY t.due_date ASC
      `;
      queryParams = [req.user.id];
    }

    const result = await query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id, title, project_id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Log activity
    await query(
      "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
      [
        req.user.id,
        "deleted_task",
        "task",
        id,
        JSON.stringify({ title: result.rows[0].title }),
      ]
    );

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, p.name as project_name, u.username as assignee_name 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      LEFT JOIN users u ON t.assigned_to = u.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
