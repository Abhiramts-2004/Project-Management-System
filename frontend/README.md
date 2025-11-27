# Frontend - Project Management System

The frontend application for the Project Management System, built with React and Vite.

## Features

- **Kanban Board:** Interactive drag-and-drop board for managing task states.
- **Dashboard:** Role-specific dashboards for Admins, Employees, and Testers.
- **Authentication:** Login and Registration pages with JWT integration.
- **Responsive Design:** Optimized for various screen sizes.

## Project Structure

- `src/components`: Reusable UI components (e.g., Button, Input, KanbanColumn).
- `src/pages`: Application pages (e.g., Login, Dashboard, ProjectList).
- `src/context`: React Context for state management (AuthContext, ToastContext).
- `src/services`: API service functions for backend communication.

## Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Run Development Server:**

    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## Configuration

The frontend expects the backend API to be running at `http://localhost:5000`. If your backend runs on a different port, update the API base URL in `src/services/api.js`.
