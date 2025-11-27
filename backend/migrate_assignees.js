import pool, { query } from './src/db/db.js';

const migrate = async () => {
  try {
    console.log('Starting migration...');

    // 1. Create the new table
    await query(`
      CREATE TABLE IF NOT EXISTS task_assignees (
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (task_id, user_id)
      )
    `);
    console.log('Created task_assignees table.');

    // 2. Migrate existing data from tasks.assigned_to to task_assignees
    const tasks = await query('SELECT id, assigned_to FROM tasks WHERE assigned_to IS NOT NULL');
    
    for (const task of tasks.rows) {
      await query(
        'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [task.id, task.assigned_to]
      );
    }
    console.log(`Migrated ${tasks.rows.length} existing assignments.`);

    // 3. Optional: Drop the old column (or keep it for backward compatibility for a bit, but we'll ignore it)
    // await query('ALTER TABLE tasks DROP COLUMN assigned_to'); 
    // We will keep it for now to avoid breaking things immediately if we rollback, but we won't use it.

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migrate();
