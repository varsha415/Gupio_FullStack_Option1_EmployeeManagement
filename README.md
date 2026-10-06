# PeopleDesk — Employee Management System

A full-stack employee directory with employee profiles, create/edit/delete workflows, live search, and department filtering. The React dashboard calls an Express API backed by MongoDB Atlas.

## Project structure

```text
backend/
  src/
    config/database.js
    middleware/errorHandler.js
    models/Employee.js
    routes/employees.js
    server.js
  .env.example
  package.json
frontend/
  src/
    api/employees.js
    components/EmployeeForm.jsx
    components/EmployeeList.jsx
    App.jsx
    main.jsx
    styles.css
  .env.example
  index.html
  package.json
.gitignore
```

## Run locally

Requirements: Node.js 18+ and a MongoDB Atlas database.

1. Create an Atlas database and add your development machine's IP address to the Atlas network access list.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` to your Atlas connection string. Set `FRONTEND_URL=http://localhost:5173`.
3. Copy `frontend/.env.example` to `frontend/.env` (the local API URL is already configured).
4. In separate terminals, run:

   ```sh
   cd backend
   npm install
   npm run dev
   ```

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

5. Open the Vite URL, normally `http://localhost:5173`. The API health endpoint is `http://localhost:5000/api/health`.

The API intentionally refuses to start if `MONGO_URI` is missing or the database cannot be reached. Employee email addresses are unique. Search matches names and email addresses; the department selector filters the directory.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | API and MongoDB connection status |
| GET | `/api/employees` | List employees |
| GET | `/api/employees/:id` | Read one employee |
| POST | `/api/employees` | Create an employee |
| PUT | `/api/employees/:id` | Update an employee |
| DELETE | `/api/employees/:id` | Delete an employee |

Employee request fields: `name`, `email`, `department`, and `designation`. Invalid input returns HTTP 400 with a message and field-level errors; duplicate email returns HTTP 409.

The supplied `backend/data/employees.csv` can be imported into MongoDB Atlas with `cd backend` followed by `npm run import:employees`. The import maps `role` to `designation`, parses `start_date`, and preserves `salary` and `office`. It upserts by email, so rerunning it does not create duplicate employee records.

## Deployment

- **Database:** Create a MongoDB Atlas cluster, database user, and network access rule for the deployed API. Set `MONGO_URI` only in the backend platform's secret environment variables.
- **Backend:** Deploy the `backend` directory as a Node service. Set `MONGO_URI`, `FRONTEND_URL` (the exact deployed frontend origin), and optionally `PORT` if required by the host. The start command is `npm start`; the health check path is `/api/health`.
- **Frontend:** Deploy the `frontend` directory as a Vite static site. Set `VITE_API_URL` to the deployed API base URL ending in `/api` (for example, `https://your-api.example.com/api`) and use `npm run build` with `dist` as the publish directory.
- For deployments with multiple frontend origins, separate the allowed origins in `FRONTEND_URL` with commas.
- After deploying, open `/api/health` and confirm it reports `"status":"ok"` and `"database":"connected"`. Then use the deployed frontend to create, edit, and delete an employee and refresh the page to confirm persistence.

Do not commit `.env` files or database credentials. This repository includes placeholder-only `.env.example` files; configure real values in each deployment provider's environment settings.

## Deployment submission

- Frontend URL: add after deploying the frontend.
- Backend/API URL: add after deploying the backend.
- Database type: MongoDB Atlas.
- Database connection confirmation: not yet verified; confirm using the deployed `/api/health` endpoint after configuring the Atlas connection string.