import { query } from './src/db/db.js';

const migrate = async () => {
  try {
    console.log('Starting migration to add "tester" role...');

    // 1. Drop the existing check constraint
    // Note: We need to find the constraint name first or assume a standard name. 
    // Often it's users_role_check. Let's try to drop it safely.
    
    // First, let's try to find the constraint name just in case, or we can just try to drop users_role_check
    // If it was created with the CREATE TABLE statement without a name, Postgres assigns one.
    // Usually <table>_<column>_check. So users_role_check.

    await query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    console.log('Dropped old constraint.');

    // 2. Add the new check constraint
    await query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'employee', 'tester'));
    `);

    console.log('Added new constraint with "tester" role.');
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
