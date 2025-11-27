# Backend - Project Management System

The backend service for the Project Management System, built with Node.js, Express.js, and PostgreSQL.

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project (Admin only)
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id/status` - Update task status (Kanban move)

## Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the `backend` directory with the following:

    ```env
    PORT=5000
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=scrum_db
    DB_PASSWORD=your_password
    DB_PORT=5432
    JWT_SECRET=your_jwt_secret_key
    ```

3.  **Database Schema:**
    Run the `schema.sql` file to set up the database tables:
    ```bash
    psql -U postgres -d scrum_db -f schema.sql
    ```

## Scripts

- `npm start`: Start the production server.
- `npm run dev`: Start the development server with Nodemon.
