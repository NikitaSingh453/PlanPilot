# PlanPilot

A work planner web app for managers and employees. Managers can create projects, assign tasks to team members, and monitor workload. Employees can manage their own personal tasks and update status on assigned ones.

## Stack

- **Frontend:** React (Vite), React Router, Axios, Lucide React
- **Backend:** Java Spring Boot, Spring Security, JWT
- **Database:** PostgreSQL

---

## Prerequisites

- Node.js 18+
- Java 17+
- Maven 3.8+
- PostgreSQL 14+

---

## Setup

### 1. Database

```sql
CREATE DATABASE planpilot;
```

Make sure PostgreSQL is running on port `5432`.

### 2. Backend

```bash
cd backend
```

Edit `src/main/resources/application.properties` and set your PostgreSQL password:

```properties
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

Run the backend:

```bash
./mvnw spring-boot:run
```

Backend starts on `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

---

## Demo credentials

Register these accounts via `http://localhost:5173/register` or use the API directly.

| Role     | Email               | Password |
|----------|---------------------|----------|
| Manager  | manager@gmail.com   | Manager  |
| Employee | employee@gmail.com  | Employee |

---

## API endpoints

| Method | Path                        | Access   | Description                  |
|--------|-----------------------------|----------|------------------------------|
| POST   | /api/auth/register          | Public   | Register a new user          |
| POST   | /api/auth/login             | Public   | Login and get JWT token      |
| GET    | /api/tasks                  | Auth     | Get tasks for current user   |
| POST   | /api/tasks/self             | Auth     | Create a personal task       |
| POST   | /api/tasks/assign/{id}      | Manager  | Assign task to a user        |
| PATCH  | /api/tasks/{id}             | Auth     | Update a task                |
| DELETE | /api/tasks/{id}             | Auth     | Delete a task                |
| GET    | /api/projects               | Manager  | List all projects            |
| POST   | /api/projects               | Manager  | Create a project             |
| DELETE | /api/projects/{id}          | Manager  | Delete a project             |
| GET    | /api/users                  | Manager  | List all employees           |
| POST   | /api/users                  | Manager  | Add a team member            |

---

## Project structure

```
PlanPilot/
├── backend/
│   └── src/main/java/com/planpilot/backend/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── model/
│       ├── dto/
│       └── security/
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── context/
        └── api/
```
