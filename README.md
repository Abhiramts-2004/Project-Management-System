# Project Management System (PMS)

A comprehensive Project Management System built with React, Node.js, and PostgreSQL. This application allows for user authentication, role-based access control (Admin, Employee, Tester), and task management via a Kanban board.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS (assumed based on modern standards, or just standard CSS if not present), React Router, Context API
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [PostgreSQL](https://www.postgresql.org/)

## Quick Start

### 1. Database Setup

1.  Create a PostgreSQL database named `scrum_db` (or as configured in your `.env`).
2.  Navigate to the `backend` directory.
3.  Run the schema script to create tables:
    ```bash
    psql -U postgres -d scrum_db -f schema.sql
    ```

### 2. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file (see `backend/README.md` for details).
4.  Start the server:
    ```bash
    npm start
    ```
    The server will run on `http://localhost:5000` (default).

### 3. Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (default).

## Features

- **User Authentication:** Secure login and registration.
- **Role-Based Access:**
  - **Admin:** Manage users, projects, and view all tasks.
  - **Employee:** View and move assigned tasks.
  - **Tester:** Review tasks and report bugs.
- **Kanban Board:** Drag-and-drop interface for task management (To Do, In Progress, Review, Done).
- **Project Management:** Create and track projects.
